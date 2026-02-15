import { useState } from "react";
import {
  Instagram, Facebook, Twitter, Linkedin, Music2,
  Youtube, MessageSquare, Share2, AtSign, Cloud,
  Zap, ChevronRight, BookOpen, Layout, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface InputFormProps {
  onGenerate: (data: any) => void;
  isLoading: boolean;
  userTier?: "free" | "starter" | "pro" | "unlimited";
}

const platforms = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600", bg: "bg-blue-50" },
  { id: "twitter", label: "X (Twitter)", icon: Twitter, color: "text-slate-900", bg: "bg-slate-50" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700", bg: "bg-blue-50" },
  { id: "tiktok", label: "TikTok", icon: Music2, color: "text-black", bg: "bg-slate-50" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600", bg: "bg-red-50" },
  { id: "reddit", label: "Reddit", icon: MessageSquare, color: "text-orange-600", bg: "bg-orange-50" },
  { id: "pinterest", label: "Pinterest", icon: Share2, color: "text-red-700", bg: "bg-red-50" },
  { id: "threads", label: "Threads", icon: AtSign, color: "text-slate-900", bg: "bg-slate-50" },
  { id: "bluesky", label: "Bluesky", icon: Cloud, color: "text-blue-400", bg: "bg-blue-50" },
];

const InputForm = ({ onGenerate, isLoading, userTier = "free" }: InputFormProps) => {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [template, setTemplate] = useState("none");
  const [fullArticle, setFullArticle] = useState(false);
  const [carousel, setCarousel] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState(5);
  const [carouselFormat, setCarouselFormat] = useState("square");

  const freePlatforms = ["instagram", "facebook", "twitter"];
  const availablePlatforms = userTier === "free"
    ? platforms.filter(p => freePlatforms.includes(p.id))
    : platforms;

  const isFeatureLocked = (feature: "carousel" | "article") => {
    return userTier === "free" || userTier === "starter";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    onGenerate({
      topic,
      platform,
      tone,
      template,
      fullArticle,
      carousel,
      carouselSlides,
      carouselFormat,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Topic or Concept</label>
        <Textarea
          placeholder="What should the post be about? (e.g., 5 tips for morning productivity)"
          className="resize-none min-h-[100px] border-slate-200 focus:ring-primary font-medium"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Select Platform</label>
        <div className="grid grid-cols-5 gap-2">
          {availablePlatforms.map((p) => (
            <TooltipProvider key={p.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${platform === p.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                  >
                    <p.icon className={`h-5 w-5 ${p.color}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-bold">
                  {p.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {userTier === "free" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl border-2 border-slate-50 opacity-40 cursor-not-allowed">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="font-bold">Upgrade to unlock more platforms</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Tone of Voice</label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="border-slate-200 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="font-medium">
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual & Friendly</SelectItem>
              <SelectItem value="bold">Bold & Confident</SelectItem>
              <SelectItem value="witty">Witty & Humorous</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Style Template</label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="border-slate-200 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="font-medium">
              <SelectItem value="none">Default Posting</SelectItem>
              <SelectItem value="expert">The Industry Expert</SelectItem>
              <SelectItem value="listicle">The Essential List</SelectItem>
              <SelectItem value="storyteller">Master Storyteller</SelectItem>
              <SelectItem value="controversial">Hot Take / Debate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between glass-card p-3 border-dashed">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isFeatureLocked("article") ? 'bg-slate-100' : 'bg-primary/10'}`}>
              <BookOpen className={`h-4 w-4 ${isFeatureLocked("article") ? 'text-slate-400' : 'text-primary'}`} />
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-1.5">
                Full Article Mode
                {isFeatureLocked("article") && <Lock className="h-3 w-3 text-slate-400" />}
              </p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">In-depth blogging</p>
            </div>
          </div>
          <Switch
            checked={fullArticle}
            onCheckedChange={(checked) => {
              if (isFeatureLocked("article")) {
                toast.error("Pro Feature", { description: "Article mode requires a Pro or Unlimited plan." });
                return;
              }
              setFullArticle(checked);
              if (checked) setCarousel(false);
            }}
          />
        </div>

        <div className="flex items-center justify-between glass-card p-3 border-dashed">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isFeatureLocked("carousel") ? 'bg-slate-100' : 'bg-amber-100'}`}>
              <Layout className={`h-4 w-4 ${isFeatureLocked("carousel") ? 'text-slate-400' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-1.5">
                Carousel Post
                {isFeatureLocked("carousel") && <Lock className="h-3 w-3 text-slate-400" />}
              </p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Swipeable slides</p>
            </div>
          </div>
          <Switch
            checked={carousel}
            onCheckedChange={(checked) => {
              if (isFeatureLocked("carousel")) {
                toast.error("Pro Feature", { description: "Carousel mode requires a Pro or Unlimited plan." });
                return;
              }
              setCarousel(checked);
              if (checked) setFullArticle(false);
            }}
          />
        </div>

        {carousel && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600">Number of Slides</label>
                <Badge variant="outline" className="bg-white font-bold">{carouselSlides}</Badge>
              </div>
              <Slider
                value={[carouselSlides]}
                onValueChange={(val) => setCarouselSlides(val[0])}
                min={3}
                max={10}
                step={1}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Canvas Format</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "square", label: "Square (1:1)", desc: "Insta/FB" },
                  { id: "portrait", label: "Portrait (4:5)", desc: "Professional" }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCarouselFormat(f.id)}
                    className={`p-2 rounded-lg border text-left transition-all ${carouselFormat === f.id ? "border-primary bg-white shadow-sm" : "border-transparent text-slate-500"
                      }`}
                  >
                    <p className="text-[10px] font-bold uppercase">{f.label}</p>
                    <p className="text-[9px] font-medium opacity-60">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        className={`w-full h-12 text-base font-bold transition-all shadow-md group ${isLoading ? 'bg-slate-100 grayscale' : 'gradient-btn'}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Generating Intelligence...
          </div>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4 fill-white animate-pulse" />
            Forge Content Now
            <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>
    </form>
  );
};

export default InputForm;
