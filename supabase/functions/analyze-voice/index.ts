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
    };

    if (GEMINI_API_KEY) {
        const geminiBody = { ...body, model: modelMap[body.model] || "gemini-1.5-flash" };
        try {
            const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify(geminiBody),
            });
            if (resp.ok) return resp;
        } catch (err) { console.error("Gemini error:", err); }
    }

    if (LOVABLE_API_KEY) {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (resp.ok) return resp;
    }

    if (OPENAI_API_KEY) {
        const openaiBody = { ...body, model: body.model.includes("gemini") ? "gpt-4o-mini" : body.model };
        return await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(openaiBody),
        });
    }

    throw new Error("No AI API key configured.");
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const authHeader = req.headers.get("Authorization")!;
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        if (authError || !user) throw new Error("Unauthorized");

        const { content } = await req.json();
        if (!content || content.length < 100) throw new Error("Please provide more content to analyze (minimum 100 characters).");

        const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();

        const systemPrompt = `Analyze this writing sample and extract the author's unique voice. 
Provide the results in structured format:
- Tone description (max 3 words)
- Writing style summary (exactly 1 sentence)
- 3 signature characteristics of this writing style
- 2 sample sentences that sound exactly like this author`;

        const functionName = "voice_analysis_result";
        const parameters = {
            type: "object",
            properties: {
                tone: { type: "string" },
                summary: { type: "string" },
                characteristics: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
                samples: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 }
            },
            required: ["tone", "summary", "characteristics", "samples"],
            additionalProperties: false
        };

        const response = await callAI({
            model: "google/gemini-pro",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze this content:\n\n${content}` }
            ],
            tools: [{ type: "function", function: { name: functionName, parameters } }],
            tool_choice: { type: "function", function: { name: functionName } }
        }, {
            customOpenAIKey: profile.custom_openai_key,
            customGeminiKey: profile.custom_gemini_key,
        });

        if (!response.ok) throw new Error("AI analysis failed");

        const data = await response.json();
        const result = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0].function.arguments);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
