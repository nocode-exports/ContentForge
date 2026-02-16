// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callAI(body: Record<string, any>, options: { customOpenAIKey?: string, customGeminiKey?: string }): Promise<Response> {
  const GEMINI_API_KEY = options.customGeminiKey || Deno.env.get("GEMINI_API_KEY");
  const OPENAI_API_KEY = options.customOpenAIKey || Deno.env.get("OPENAI_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const modelMap: Record<string, string> = {
    "google/gemini-pro": "gemini-1.5-pro",
    "google/gemini-flash": "gemini-1.5-flash",
    "google/gemini-3-flash-preview": "gemini-1.5-flash", // legacy mapping
  };

  // 1. Try Gemini AI first (Primary)
  if (GEMINI_API_KEY) {
    const geminiBody = {
      ...body,
      model: modelMap[body.model] || "gemini-1.5-flash",
    };

    try {
      const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiBody),
      });

      if (resp.ok) return resp;

      console.error(`Gemini AI returned ${resp.status}:`, await resp.clone().text());
      // Fall through to other providers if 429 or 5xx
    } catch (err) {
      console.error("Gemini fetch error:", err);
    }
  }

  // 2. Try Lovable AI (ContentForge)
  if (LOVABLE_API_KEY) {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (resp.ok) return resp;
    console.error(`Lovable AI returned ${resp.status}`);
  }

  // 3. Fallback to OpenAI
  if (OPENAI_API_KEY) {
    const openaiBody = {
      ...body,
      model: body.model.includes("gemini") ? "gpt-4o-mini" : body.model,
    };

    return await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(openaiBody),
    });
  }

  throw new Error("No AI API key configured or all providers failed. Please set GEMINI_API_KEY or OPENAI_API_KEY.");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Could not fetch user profile");

    // Monthly Reset Logic
    const now = new Date();
    const lastReset = new Date(profile.last_usage_reset);
    let currentUsage = profile.monthly_usage_count;

    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      currentUsage = 0;
      await supabase
        .from("profiles")
        .update({ monthly_usage_count: 0, last_usage_reset: now.toISOString() })
        .eq("user_id", user.id);
    }

    const { topic, platform, tone, template, fullArticle, carousel, carouselSlides, includeImage, voiceProfileId } = await req.json();

    // Tier Enforcement logic
    const tier = profile.role === 'super_admin' || profile.role === 'admin' ? 'unlimited' : (profile.tier as string || 'free');
    const limits: Record<string, number> = { free: 500, starter: 50000, pro: 999999, unlimited: 999999, lifetime: 999999 };

    // Check if user has their own keys
    const hasBYOK = !!(profile.custom_gemini_key || profile.custom_openai_key);

    // Free tier word limit applies even with BYOK for platform traffic management
    if (currentUsage >= limits[tier]) {
      return new Response(JSON.stringify({ error: `Monthly word limit reached for ${tier} tier. Please upgrade.` }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Credits check if no BYOK and not on a high-tier plan (pro/lifetime/unlimited)
    const isPaidTier = ['pro', 'unlimited', 'lifetime'].includes(tier);
    const isFreeUnderLimit = tier === 'free' && currentUsage < limits.free;

    if (!hasBYOK && !isPaidTier && !isFreeUnderLimit) {
      if ((profile.credits_balance || 0) < 5) { // Minimum 5 credits to start (500 words)
        return new Response(JSON.stringify({ error: "Insufficient credits. Please add credits or Bring Your Own API Key." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // restricted platforms for free tier
    const freePlatforms = ["facebook", "instagram", "twitter"];
    if (tier === "free" && !freePlatforms.includes(platform)) {
      return new Response(JSON.stringify({ error: "This platform is only available on paid plans." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carousel/Article restricted for free/starter unless they have BYOK? 
    // Usually these modes generate MORE words. We'll allow it if they BYOK or have enough credits.
    // Based on pivot: "One-time payment. All Pro features forever." for Lifetime.
    // "Carousel and Article modes are available on Pro and Unlimited plans."
    if ((fullArticle || carousel) && !isPaidTier && !hasBYOK) {
      return new Response(JSON.stringify({ error: "Carousel and Article modes are available on Pro and Unlimited plans. You can also unlock them by bringing your own API key." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platformLimits: Record<string, number> = {
      twitter: 280, instagram: 2200, linkedin: 3000, facebook: 5000,
      reddit: 10000, pinterest: 500, tiktok: 2200, youtube: 5000,
      threads: 500, snapchat: 250, bluesky: 300, mastodon: 500,
    };

    const charLimit = platformLimits[platform] || 2200;
    const templateHint = template && template !== "none" ? `Use a "${template}" style format.` : "";

    let functionName = "generate_social_content";
    let systemPrompt: string;
    let parameters: Record<string, any>;

    let voiceContext = "";
    if (voiceProfileId && voiceProfileId !== "none") {
      const { data: voiceProfile } = await supabase.from("voice_profiles").select("*").eq("id", voiceProfileId).single();
      if (voiceProfile) {
        voiceContext = `\n\nWriting Voice / Tone Context (STRICTLY FOLLOW THIS):
- Tone: ${voiceProfile.tone_description}
- Style: ${voiceProfile.writing_style}
- Characteristics: ${voiceProfile.characteristics.join(", ")}
- Inspiration Samples: "${voiceProfile.sample_sentences.join('" | "')}"`;
      }
    }

    const effectiveTone = voiceContext ? "Custom Voice Profile (attached below)" : tone;

    const bioContext = profile.bio ? `\n\nUser/Brand Context: ${profile.bio}` : "";
    const imageInstruction = includeImage !== false ? "- Include an AI image suggestion prompt" : "- DO NOT include any image prompts or visual descriptions";
    const heroImageInstruction = includeImage !== false ? "- Include a hero image prompt" : "- DO NOT include any image prompts";
    const carouselImageInstruction = includeImage !== false ? "- Each slide needs a title, bullet points (2-3), and a visual description for image generation" : "- Each slide needs a title and bullet points (2-3) only";

    if (fullArticle) {
      functionName = "generate_full_article";
      systemPrompt = `You are a world-class content writer. Generate a comprehensive blog-style article (800–1200 words) about the given topic.
${bioContext}

Rules:
- Tone: ${effectiveTone}
- Optimized for ${platform} audience
- ${templateHint}
${voiceContext}
- Include a compelling headline
- Structure with subheadings (H2/H3), bullet points, and clear sections
- Include an engaging introduction and strong conclusion
- ${includeImage !== false ? "For each major section, include an AI image suggestion prompt" : "Focus entirely on high-quality text content, no image prompts needed."}

Return structured output with the article content and image suggestions.`;

      parameters = {
        type: "object",
        properties: {
          headline: { type: "string", description: "Article headline" },
          post: { type: "string", description: "Full article in markdown (800-1200 words with ## headings, bullet points, bold text)" },
          hashtags: { type: "array", items: { type: "string" }, description: "Relevant hashtags" },
          cta: { type: "string", description: "Call to action" },
          imagePrompt: { type: "string", description: includeImage !== false ? "Hero image prompt" : "Empty string" },
          sectionImages: {
            type: "array",
            items: {
              type: "object",
              properties: { section: { type: "string" }, imagePrompt: { type: "string" } },
              required: ["section", "imagePrompt"],
              additionalProperties: false,
            },
            description: includeImage !== false ? "Image suggestions for each section" : "Empty list",
          },
        },
        required: ["headline", "post", "hashtags", "cta", "imagePrompt", "sectionImages"],
        additionalProperties: false,
      };
    } else if (carousel) {
      functionName = "generate_carousel_content";
      const slideCount = carouselSlides || 5;
      systemPrompt = `You are a world-class social media content strategist specializing in carousel posts. Generate a ${slideCount}-slide carousel post optimized for ${platform}.
${bioContext}

Rules:
- Tone: ${effectiveTone}
- ${templateHint}
- ${carouselImageInstruction}
${voiceContext}
- First slide should be a hook/cover, last slide should be a CTA
- Keep text per slide concise and impactful
- Maintain consistent branding narrative across all slides

Return structured output.`;

      parameters = {
        type: "object",
        properties: {
          headline: { type: "string", description: "Carousel series title" },
          post: { type: "string", description: "Caption text for the carousel post" },
          hashtags: { type: "array", items: { type: "string" }, description: "Relevant hashtags" },
          cta: { type: "string", description: "Call to action" },
          imagePrompt: { type: "string", description: includeImage !== false ? "Overall visual theme prompt" : "Empty string" },
          slides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                slideNumber: { type: "number" },
                title: { type: "string" },
                bulletPoints: { type: "array", items: { type: "string" } },
                imagePrompt: { type: "string", description: includeImage !== false ? "Detailed image generation prompt for this slide" : "Empty string" },
              },
              required: ["slideNumber", "title", "bulletPoints", "imagePrompt"],
              additionalProperties: false,
            },
            description: `Array of exactly ${slideCount} slides`,
          },
        },
        required: ["headline", "post", "hashtags", "cta", "imagePrompt", "slides"],
        additionalProperties: false,
      };
    } else {
      systemPrompt = `You are a world-class social media content strategist. Generate engaging content optimized for ${platform}.
${bioContext}

Rules:
- Tone: ${effectiveTone}
- Max post length: ${charLimit} characters
- ${templateHint}
${voiceContext}
${includeImage !== false ? "- Include a detailed image generation prompt" : "- DO NOT include any image prompts"}

Return a JSON object with exactly these fields:
- headline: A catchy, attention-grabbing headline (max 80 chars)
- post: The main post text, optimized for ${platform} engagement
- hashtags: An array of 5-8 relevant hashtags (without the # symbol)
- cta: A compelling call-to-action sentence
- imagePrompt: ${includeImage !== false ? "A detailed image generation prompt" : "Empty string"}`;

      parameters = {
        type: "object",
        properties: {
          headline: { type: "string", description: "Catchy headline" },
          post: { type: "string", description: "Main post text" },
          hashtags: { type: "array", items: { type: "string" }, description: "Relevant hashtags" },
          cta: { type: "string", description: "Call to action" },
          imagePrompt: { type: "string", description: "Image generation prompt" },
        },
        required: ["headline", "post", "hashtags", "cta", "imagePrompt"],
        additionalProperties: false,
      };
    }

    const response = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create social media content about: "${topic}"` },
      ],
      tools: [
        {
          type: "function",
          function: { name: functionName, description: "Generate structured social media content", parameters },
        },
      ],
      tool_choice: { type: "function", function: { name: functionName } },
    }, {
      customOpenAIKey: profile.custom_openai_key,
      customGeminiKey: profile.custom_gemini_key,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted and no OpenAI fallback configured. Please add funds or set OPENAI_API_KEY." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) throw new Error("No structured output returned");

    const content = JSON.parse(toolCall.function.arguments);
    const wordCount = content.post ? content.post.split(/\s+/).length : 50; // estimate if post is empty (carousel/article)
    const effectiveWordCount = fullArticle ? 1000 : carousel ? 500 : wordCount;

    // Credit Deduction logic
    let creditDeduction = 0;
    if (!hasBYOK && !isPaidTier) {
      // 1 Credit = 100 words. Round up.
      creditDeduction = Math.max(1, Math.ceil(effectiveWordCount / 100));
    }

    // Update usage and credits
    await supabase
      .from("profiles")
      .update({
        monthly_usage_count: currentUsage + effectiveWordCount,
        credits_balance: Math.max(0, (profile.credits_balance || 0) - creditDeduction)
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
