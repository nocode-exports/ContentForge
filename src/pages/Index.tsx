import { useState, useCallback, useRef } from "react";
import { Zap, LogOut, LogIn, Shield, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import InputForm from "@/components/InputForm";
import TextResult from "@/components/TextResult";
import ImageResult from "@/components/ImageResult";
import ArticleResult from "@/components/ArticleResult";
import CarouselResult from "@/components/CarouselResult";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import WatermarkSettings, { WatermarkConfig } from "@/components/WatermarkSettings";
import HistoryPanel from "@/components/HistoryPanel";
import { Button } from "@/components/ui/button";

interface GeneratedContent {
  headline: string;
  post: string;
  hashtags: string[];
  cta: string;
  imagePrompt: string;
  sectionImages?: { section: string; imagePrompt: string }[];
  slides?: { slideNumber: number; title: string; bulletPoints: string[]; imagePrompt: string; imageUrl?: string | null }[];
}

const defaultWatermark: WatermarkConfig = {
  enabled: false,
  type: "text",
  text: "",
  logoUrl: null,
  position: "bottom-right",
  opacity: 0.7,
};

const Index = () => {
  const { user, profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingCarousel, setIsGeneratingCarousel] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("square");
  const [lastInput, setLastInput] = useState<any>(null);
  const [watermark, setWatermark] = useState<WatermarkConfig>(defaultWatermark);
  const [mode, setMode] = useState<"post" | "article" | "carousel">("post");

  const saveToHistory = async (input: any, result: GeneratedContent, imgUrl: string | null) => {
    if (!user) return;
    await supabase.from("content_history").insert({
      user_id: user.id,
      topic: input.topic,
      platform: input.platform,
      tone: input.tone,
      template: input.template,
      headline: result.headline,
      post: result.post,
      hashtags: result.hashtags,
      cta: result.cta,
      image_prompt: result.imagePrompt,
      image_url: imgUrl,
    });
  };

  const generateText = useCallback(async (input: any) => {
    setIsGeneratingText(true);
    setLastInput(input);

    const currentMode = input.fullArticle ? "article" : input.carousel ? "carousel" : "post";
    setMode(currentMode);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", { body: input });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setContent(data as GeneratedContent);
      return data as GeneratedContent;
    } catch (err: any) {
      toast.error(err.message || "Failed to generate text");
      return null;
    } finally {
      setIsGeneratingText(false);
    }
  }, []);

  const generateImage = useCallback(async (prompt: string, ratio: string) => {
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt, aspectRatio: ratio },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setImageUrl(data.imageUrl);
      return data.imageUrl as string;
    } catch (err: any) {
      toast.error(err.message || "Failed to generate image");
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  }, []);

  const generateCarouselImages = useCallback(async (slides: GeneratedContent["slides"]) => {
    if (!slides) return;
    setIsGeneratingCarousel(true);
    try {
      const carouselFormat = lastInput?.carouselFormat || "square";
      const updatedSlides = await Promise.all(
        slides.map(async (slide) => {
          const { data, error } = await supabase.functions.invoke("generate-image", {
            body: { prompt: slide.imagePrompt, aspectRatio: carouselFormat },
          });
          if (!error && data?.imageUrl) {
            return { ...slide, imageUrl: data.imageUrl };
          }
          return slide;
        })
      );

      setContent((prev) => prev ? { ...prev, slides: updatedSlides } : prev);
      return updatedSlides;
    } catch (err: any) {
      toast.error("Some carousel images failed to generate");
      return slides;
    } finally {
      setIsGeneratingCarousel(false);
    }
  }, [lastInput]);

  const handleGenerate = async (input: any) => {
    const result = await generateText(input);
    if (!result) return;

    let finalImageUrl = null;
    let finalSlides = result.slides;

    if (input.carousel && result.slides) {
      finalSlides = await generateCarouselImages(result.slides);
    } else if (result.imagePrompt && !input.fullArticle) {
      finalImageUrl = await generateImage(result.imagePrompt, aspectRatio);
    }

    // Save to history AFTER all generations are complete
    await saveToHistory(input, { ...result, slides: finalSlides }, finalImageUrl);

    // Refresh profile to update usage count
    await refreshProfile();
  };

  const handleRegenerateText = () => {
    if (lastInput) generateText(lastInput);
  };

  const handleRegenerateImage = () => {
    if (content?.imagePrompt) generateImage(content.imagePrompt, aspectRatio);
  };

  const handleRegenerateSlide = async (slideIndex: number) => {
    if (!content?.slides?.[slideIndex]) return;
    const slide = content.slides[slideIndex];
    const { data, error } = await supabase.functions.invoke("generate-image", {
      body: { prompt: slide.imagePrompt, aspectRatio: lastInput?.carouselFormat || "square" },
    });
    if (!error && data?.imageUrl) {
      setContent((prev) => {
        if (!prev?.slides) return prev;
        const updated = [...prev.slides];
        updated[slideIndex] = { ...updated[slideIndex], imageUrl: data.imageUrl };
        return { ...prev, slides: updated };
      });
    }
  };

  const handleUpdateCustomKey = async (key: string) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ custom_openai_key: key }).eq("user_id", user.id);
    if (error) {
      toast.error("Failed to update API key");
    } else {
      toast.success("API key updated successfully");
      refreshProfile();
    }
  };

  const handleLoadHistory = (item: any) => {
    setContent({
      headline: item.headline,
      post: item.post,
      hashtags: item.hashtags,
      cta: item.cta || "",
      imagePrompt: item.image_prompt || "",
    });
    setImageUrl(item.image_url);
    setMode("post");
    setLastInput({
      topic: item.topic,
      platform: item.platform,
      tone: item.tone,
      template: item.template || "none",
      fullArticle: false,
      carousel: false,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl gradient-btn flex items-center justify-center shadow-md">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">ContentForge</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Social Media Generator</p>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              {(profile?.role === "admin" || profile?.role === "super_admin") && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-muted-foreground hover:text-primary gap-2 hidden md:flex">
                  <Shield className="h-4 w-4" /> Admin
                </Button>
              )}
              <span className="text-xs text-muted-foreground hidden lg:block">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground gap-2">
              <LogIn className="h-4 w-4" /> Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Create <span className="gradient-text">stunning content</span> in seconds
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Enter your topic, pick a platform & tone, and let AI craft scroll-stopping posts with matching visuals.
          </p>
        </div>

        <InputForm onGenerate={handleGenerate} isLoading={isGeneratingText} userTier={profile?.tier} />

        {user && profile && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
                {profile.tier} Plan
              </div>
              <p className="text-sm text-muted-foreground">
                Usage: <span className="font-bold text-foreground">{profile.monthly_usage_count}</span> posts this month
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/pricing")} className="text-xs h-8">
              Upgrade
            </Button>
          </div>
        )}

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WatermarkSettings config={watermark} onChange={setWatermark} />
            <div className="space-y-6">
              {profile?.tier === "unlimited" && (
                <div className="glass-card p-6 space-y-4 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Custom OpenAI API Key</h3>
                      <p className="text-xs text-muted-foreground italic">Unlimited tier perk</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="sk-..."
                      defaultValue={profile?.custom_openai_key || ""}
                      onBlur={(e) => handleUpdateCustomKey(e.target.value)}
                      className="flex-1 bg-secondary/50 border border-border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    This key will be used for your content generations. Leave blank to use system defaults.
                  </p>
                </div>
              )}
              <HistoryPanel onLoad={handleLoadHistory} />
            </div>
          </div>
        )}

        {isGeneratingText && !content && <LoadingSkeleton />}

        {content && mode === "article" && (
          <ArticleResult
            headline={content.headline}
            post={content.post}
            hashtags={content.hashtags}
            cta={content.cta}
            sectionImages={content.sectionImages || []}
            onRegenerate={handleRegenerateText}
            isRegenerating={isGeneratingText}
          />
        )}

        {content && mode === "carousel" && content.slides && (
          <CarouselResult
            headline={content.headline}
            slides={content.slides}
            format={lastInput?.carouselFormat || "square"}
            isGeneratingImages={isGeneratingCarousel}
            onRegenerateSlide={handleRegenerateSlide}
          />
        )}

        {content && mode === "post" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TextResult
              headline={content.headline}
              post={content.post}
              hashtags={content.hashtags}
              cta={content.cta}
              onRegenerate={handleRegenerateText}
              isRegenerating={isGeneratingText}
            />
            <ImageResult
              imageUrl={imageUrl}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              onRegenerate={handleRegenerateImage}
              isGenerating={isGeneratingImage}
              watermark={watermark}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
