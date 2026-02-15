import { useState, useCallback, useEffect } from "react";
import { Zap, LogOut, Sparkles, Image, Shield, Settings, User } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
  const { user, profile, refreshProfile, signOut } = useAuth();
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
      carousel: !!input.carousel,
      full_article: !!input.fullArticle,
      slides: input.carousel ? JSON.stringify(result.slides) : null,
      section_images: input.fullArticle ? JSON.stringify(result.sectionImages) : null,
    });
  };

  const generateText = useCallback(async (input: any) => {
    setIsGeneratingText(true);
    setLastInput(input);

    const currentMode = input.fullArticle ? "article" : input.carousel ? "carousel" : "post";
    setMode(currentMode);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", { body: input });
      if (error) {
        if (error.message?.includes("Monthly limit reached")) {
          toast.error("Monthly limit reached", {
            description: "Please upgrade your plan to continue generating content.",
            action: {
              label: "Upgrade",
              onClick: () => navigate("/pricing"),
            },
          });
        }
        throw error;
      };
      if (data.error) throw new Error(data.error);
      setContent(data as GeneratedContent);
      return data as GeneratedContent;
    } catch (err: any) {
      toast.error(err.message || "Failed to generate text");
      return null;
    } finally {
      setIsGeneratingText(false);
    }
  }, [navigate]);

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
    setIsGeneratingText(true);
    setLastInput(input);

    try {
      const result = await generateText(input);
      if (!result) return;

      let finalImageUrl = null;
      let finalSlides = result.slides;

      if (input.carousel && result.slides) {
        finalSlides = await generateCarouselImages(result.slides);
      } else if (result.imagePrompt && !input.fullArticle) {
        finalImageUrl = await generateImage(result.imagePrompt, aspectRatio);
      }

      await saveToHistory(input, { ...result, slides: finalSlides }, finalImageUrl);
      toast.success("Content generated successfully!");
      refreshProfile();
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleRegenerateText = () => {
    if (lastInput) generateText(lastInput);
  };

  const handleRegenerateImage = () => {
    if (content?.imagePrompt) generateImage(content.imagePrompt, aspectRatio);
  };

  const handleRegenerateSlide = async (slideIndex: number) => {
    if (!content?.slides?.[slideIndex]) return;
    setIsGeneratingCarousel(true);
    const slide = content.slides[slideIndex];
    try {
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
      } else {
        toast.error(error?.message || "Failed to regenerate slide image");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate slide image");
    } finally {
      setIsGeneratingCarousel(false);
    }
  };

  const handleLoadHistory = (item: any) => {
    setContent({
      headline: item.headline,
      post: item.post,
      hashtags: item.hashtags,
      cta: item.cta || "",
      imagePrompt: item.image_prompt || "",
      sectionImages: item.full_article ? JSON.parse(item.section_images || "[]") : [],
      slides: item.carousel ? JSON.parse(item.slides || "[]") : [],
    });
    setImageUrl(item.image_url);
    setLastInput({
      topic: item.topic,
      platform: item.platform,
      tone: item.tone,
      template: item.template || "none",
      fullArticle: item.full_article || false,
      carousel: item.carousel || false,
      carouselFormat: item.carousel_format || "square",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">ContentForge</h1>
            <p className="text-slate-500 font-medium">Elevate your social media strategy with AI</p>
          </div>
          <Button onClick={() => navigate("/auth")} size="lg" className="w-full gradient-btn">
            Sign In to Start
          </Button>
        </div>
      </div>
    );
  }

  const limits: Record<string, number> = { free: 5, starter: 50, pro: 200, unlimited: 9999 };
  const tierLimit = limits[profile?.tier as string] || 5;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-12">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">ContentForge</span>
          </div>

          <div className="flex items-center gap-4">
            {profile?.role && ["super_admin", "admin"].includes(profile.role) && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="font-bold text-primary">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")} className="font-bold">
              <Zap className="h-4 w-4 mr-2 text-amber-500" />
              {profile?.tier ? profile.tier.toUpperCase() : "FREE"} PLAN
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="font-bold text-slate-500">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="font-bold text-slate-500">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Create <span className="gradient-text">stunning content</span> in seconds
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto font-medium">
            Enter your topic, pick a platform & tone, and let AI craft scroll-stopping posts with matching visuals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Plan Usage</h3>
                <Badge variant="secondary" className="font-bold">
                  {profile?.monthly_usage_count || 0} / {tierLimit === 9999 ? "∞" : tierLimit}
                </Badge>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, ((profile?.monthly_usage_count || 0) / tierLimit) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Resets on {profile?.last_usage_reset ? new Date(profile.last_usage_reset).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="glass-card p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Input Details
              </h2>
              <InputForm
                onGenerate={handleGenerate}
                isLoading={isGeneratingText}
                userTier={profile?.tier || "free"}
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <WatermarkSettings config={watermark} onChange={setWatermark} />
              <HistoryPanel onLoad={handleLoadHistory} />
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col min-h-[600px] space-y-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <TextResult
                    headline={content.headline}
                    post={content.post}
                    hashtags={content.hashtags}
                    cta={content.cta}
                    onRegenerate={handleRegenerateText}
                    isRegenerating={isGeneratingText}
                  />
                </div>
                <div className="lg:col-span-5">
                  <ImageResult
                    imageUrl={imageUrl}
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    onRegenerate={handleRegenerateImage}
                    isGenerating={isGeneratingImage}
                    watermark={watermark}
                  />
                </div>
              </div>
            )}

            {!content && !isGeneratingText && (
              <div className="flex-grow flex flex-col items-center justify-center glass-card bg-white/50 border-dashed space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Image className="h-8 w-8 text-slate-300" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-400">Your masterpiece awaits</h3>
                  <p className="text-sm text-slate-400 font-medium">Fill out the form to generate professional social content.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
