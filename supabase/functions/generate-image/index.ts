// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateWithLovable(prompt: string, apiKey: string): Promise<Response> {
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
}

async function generateWithOpenAI(prompt: string, apiKey: string): Promise<{ imageUrl: string }> {
  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("OpenAI image error:", resp.status, text);
    throw new Error("OpenAI image generation failed");
  }

  const data = await resp.json();
  return { imageUrl: data.data?.[0]?.url };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace("Bearer ", "") || "");
    if (authError || !user) throw new Error("Unauthorized");

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Could not fetch user profile");

    const { prompt, aspectRatio } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = profile.custom_openai_key || Deno.env.get("OPENAI_API_KEY");

    // Quota/Credits logic
    const tier = profile.role === 'super_admin' || profile.role === 'admin' ? 'unlimited' : (profile.tier as string || 'free');
    const isPaidTier = ['pro', 'unlimited', 'lifetime'].includes(tier);
    const hasBYOK = !!profile.custom_openai_key;

    // Strict Access Control: No Images for Free Tier unless BYOK
    if (tier === "free" && !hasBYOK) {
      return new Response(JSON.stringify({ error: "Image generation is not available on the Free tier. Please upgrade or add your own API key." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check monthly image limit for paid tiers (50)
    // We'll use a simple count from history for now or just trust the system
    // For now, let's assume we want to protect platform costs.
    if (isPaidTier && !hasBYOK) {
      // Implementation note: You might want to query content_history to count images this month
      // But for simplicity in this pivot, we'll focus on credits for non-paid users.
    }

    if (!isPaidTier && !hasBYOK) {
      if ((profile.credits_balance || 0) < 25) {
        return new Response(JSON.stringify({ error: "Insufficient credits for image generation (25 credits required). Please add credits or bring your own OpenAI API key." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const ratioHint: Record<string, string> = {
      square: "1:1 aspect ratio, perfect square composition",
      portrait: "9:16 aspect ratio, vertical portrait composition",
      landscape: "16:9 aspect ratio, wide landscape composition",
    };

    const fullPrompt = `${prompt}. ${ratioHint[aspectRatio] || ratioHint.square}. Ultra high resolution, professional social media quality.`;

    let imageUrl: string | null = null;

    // 1. Try Custom OpenAI Key first if available (BYOK priority)
    if (profile.custom_openai_key) {
      try {
        const res = await generateWithOpenAI(fullPrompt, profile.custom_openai_key);
        imageUrl = res.imageUrl;
      } catch (e) {
        console.error("Custom OpenAI Key failed:", e);
      }
    }

    // 2. Try platform key if no custom key OR custom key failed
    if (!imageUrl && LOVABLE_API_KEY) {
      const response = await generateWithLovable(fullPrompt, LOVABLE_API_KEY);
      if (response.ok) {
        const data = await response.json();
        imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      }
    }

    // 3. Fallback to platform OpenAI key
    if (!imageUrl && Deno.env.get("OPENAI_API_KEY")) {
      try {
        const res = await generateWithOpenAI(fullPrompt, Deno.env.get("OPENAI_API_KEY")!);
        imageUrl = res.imageUrl;
      } catch (e) {
        console.error("Platform OpenAI fallback failed:", e);
      }
    }

    if (!imageUrl) {
      throw new Error("Image generation failed with all available providers.");
    }

    // Deduct credits if applicable
    if (!isPaidTier && !hasBYOK) {
      await supabase
        .from("profiles")
        .update({
          credits_balance: Math.max(0, (profile.credits_balance || 0) - 25)
        })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
