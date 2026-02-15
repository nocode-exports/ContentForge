import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callAI(body: Record<string, any>): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  // Try Lovable AI first
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

    // If 402 (credits exhausted) or 429 (rate limit), fall back to OpenAI
    if ((resp.status === 402 || resp.status === 429) && OPENAI_API_KEY) {
      console.log(`Lovable AI returned ${resp.status}, falling back to OpenAI`);
    } else {
      return resp; // Return the error response as-is
    }
  }

  // Fallback to OpenAI
  if (!OPENAI_API_KEY) {
    throw new Error("No AI API key configured. Set LOVABLE_API_KEY or OPENAI_API_KEY.");
  }

  // Map model names for OpenAI
  const modelMap: Record<string, string> = {
    "google/gemini-3-flash-preview": "gpt-4o-mini",
    "google/gemini-2.5-flash": "gpt-4o-mini",
    "google/gemini-2.5-pro": "gpt-4o",
  };
  const openaiBody = {
    ...body,
    model: modelMap[body.model] || "gpt-4o-mini",
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, platform, tone, template, fullArticle, carousel, carouselSlides } = await req.json();

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

    if (fullArticle) {
      functionName = "generate_full_article";
      systemPrompt = `You are a world-class content writer. Generate a comprehensive blog-style article (800–1200 words) about the given topic.

Rules:
- Tone: ${tone}
- Optimized for ${platform} audience
- ${templateHint}
- Include a compelling headline
- Structure with subheadings (H2/H3), bullet points, and clear sections
- Include an engaging introduction and strong conclusion
- For each major section, include an AI image suggestion prompt

Return structured output with the article content and image suggestions.`;

      parameters = {
        type: "object",
        properties: {
          headline: { type: "string", description: "Article headline" },
          post: { type: "string", description: "Full article in markdown (800-1200 words with ## headings, bullet points, bold text)" },
          hashtags: { type: "array", items: { type: "string" }, description: "Relevant hashtags" },
          cta: { type: "string", description: "Call to action" },
          imagePrompt: { type: "string", description: "Hero image prompt" },
          sectionImages: {
            type: "array",
            items: {
              type: "object",
              properties: { section: { type: "string" }, imagePrompt: { type: "string" } },
              required: ["section", "imagePrompt"],
              additionalProperties: false,
            },
            description: "Image suggestions for each section",
          },
        },
        required: ["headline", "post", "hashtags", "cta", "imagePrompt", "sectionImages"],
        additionalProperties: false,
      };
    } else if (carousel) {
      functionName = "generate_carousel_content";
      const slideCount = carouselSlides || 5;
      systemPrompt = `You are a world-class social media content strategist specializing in carousel posts. Generate a ${slideCount}-slide carousel post optimized for ${platform}.

Rules:
- Tone: ${tone}
- ${templateHint}
- Each slide needs a title, bullet points (2-3), and a visual description for image generation
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
          imagePrompt: { type: "string", description: "Overall visual theme prompt" },
          slides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                slideNumber: { type: "number" },
                title: { type: "string" },
                bulletPoints: { type: "array", items: { type: "string" } },
                imagePrompt: { type: "string", description: "Detailed image generation prompt for this slide" },
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

Rules:
- Tone: ${tone}
- Max post length: ${charLimit} characters
- ${templateHint}

Return a JSON object with exactly these fields:
- headline: A catchy, attention-grabbing headline (max 80 chars)
- post: The main post text, optimized for ${platform} engagement
- hashtags: An array of 5-8 relevant hashtags (without the # symbol)
- cta: A compelling call-to-action sentence
- imagePrompt: A detailed image generation prompt that would create a stunning visual for this post.`;

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
