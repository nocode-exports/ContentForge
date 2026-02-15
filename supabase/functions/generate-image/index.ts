import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, aspectRatio } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!LOVABLE_API_KEY && !OPENAI_API_KEY) {
      throw new Error("No AI API key configured. Set LOVABLE_API_KEY or OPENAI_API_KEY.");
    }

    const ratioHint: Record<string, string> = {
      square: "1:1 aspect ratio, perfect square composition",
      portrait: "9:16 aspect ratio, vertical portrait composition",
      landscape: "16:9 aspect ratio, wide landscape composition",
    };

    const fullPrompt = `${prompt}. ${ratioHint[aspectRatio] || ratioHint.square}. Ultra high resolution, professional social media quality.`;

    // Try ContentForge AI first
    if (LOVABLE_API_KEY) {
      const response = await generateWithLovable(fullPrompt, LOVABLE_API_KEY);

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (imageUrl) {
          return new Response(JSON.stringify({ imageUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Fall back to OpenAI on 402/429
      if ((response.status === 402 || response.status === 429) && OPENAI_API_KEY) {
        console.log(`ContentForge AI returned ${response.status}, falling back to OpenAI DALL-E`);
      } else if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted and no OpenAI fallback configured." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const text = await response.text();
        console.error("Image gen error:", response.status, text);
        throw new Error("Image generation failed");
      }
    }

    // OpenAI fallback
    if (!OPENAI_API_KEY) throw new Error("No fallback API key available");

    const result = await generateWithOpenAI(fullPrompt, OPENAI_API_KEY);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
