import { useState } from "react";
import { Sparkles, Loader2, FileText, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InputFormProps {
  onGenerate: (data: {
    topic: string;
    platform: string;
    tone: string;
    template: string;
    fullArticle: boolean;
    carousel: boolean;
    carouselSlides: number;
    carouselFormat: string;
  }) => void;
  isLoading: boolean;
  userTier?: string;
}

const platforms = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "twitter", label: "Twitter / X", icon: "𝕏" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "reddit", label: "Reddit", icon: "🟠" },
  { value: "pinterest", label: "Pinterest", icon: "📌" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "threads", label: "Threads", icon: "🧵" },
  { value: "snapchat", label: "Snapchat", icon: "👻" },
  { value: "bluesky", label: "Bluesky", icon: "🦋" },
  { value: "mastodon", label: "Mastodon", icon: "🐘" },
];

const tones = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
  { value: "witty", label: "Witty" },
  { value: "empathetic", label: "Empathetic" },
  { value: "bold", label: "Bold" },
  { value: "minimalist", label: "Minimalist" },
  { value: "playful", label: "Playful" },
  { value: "authoritative", label: "Authoritative" },
  { value: "storytelling", label: "Storytelling" },
  { value: "controversial", label: "Controversial" },
  { value: "warm", label: "Warm" },
  { value: "futuristic", label: "Futuristic" },
];

const templates = [
  { value: "none", label: "No template" },
  { value: "quote", label: "Quote" },
  { value: "announcement", label: "Announcement" },
  { value: "promotion", label: "Promotion" },
  { value: "educational", label: "Educational" },
  { value: "how-to", label: "How-to Guide" },
  { value: "listicle", label: "Listicle" },
  { value: "behind-the-scenes", label: "Behind the Scenes" },
  { value: "myth-buster", label: "Myth Buster" },
  { value: "testimonial", label: "Customer Testimonial" },
  { value: "poll", label: "Poll / Question" },
  { value: "event-invite", label: "Event Invite" },
  { value: "ama", label: "AMA" },
  { value: "infographic", label: "Infographic" },
  { value: "comparison", label: "Comparison" },
  { value: "throwback", label: "Throwback" },
  { value: "flash-sale", label: "Urgent / Flash Sale" },
  { value: "trend-report", label: "Trend Report" },
  { value: "case-study", label: "Case Study" },
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

  const isFree = userTier === "free";
  const isStarter = userTier === "starter";
  const isBasicsOnly = isFree || isStarter;

  const availablePlatforms = isFree
    ? platforms.filter(p => ["facebook", "instagram", "twitter"].includes(p.value))
    : platforms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate({ topic, platform, tone, template, fullArticle, carousel, carouselSlides, carouselFormat });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="topic" className="text-sm font-semibold text-foreground">
          What's your topic?
        </Label>
        <Input
          id="topic"
          placeholder='e.g. "Summer gardening tips" or "New product launch"'
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/60 h-12 text-base focus:ring-primary/40 focus:border-primary/40 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="bg-secondary/50 border-border h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60">
              {availablePlatforms.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <span className="flex items-center gap-2">
                    <span>{p.icon}</span> {p.label}
                  </span>
                </SelectItem>
              ))}
              {isFree && (
                <div className="p-2 text-xs text-muted-foreground border-t border-border mt-1">
                  Upgrade to unlock 9+ more platforms
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="bg-secondary/50 border-border h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60">
              {tones.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Template</Label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="bg-secondary/50 border-border h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60">
              {templates.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60 ${isBasicsOnly ? 'opacity-60 grayscale-[0.5]' : ''}`}>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Full Article</p>
              <p className="text-xs text-muted-foreground">{isBasicsOnly ? 'Pro feature' : '800–1200 word blog post'}</p>
            </div>
          </div>
          <Switch checked={fullArticle} onCheckedChange={setFullArticle} disabled={isBasicsOnly} />
        </div>

        <div className={`flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60 ${isBasicsOnly ? 'opacity-60 grayscale-[0.5]' : ''}`}>
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-semibold text-foreground">Carousel Post</p>
              <p className="text-xs text-muted-foreground">{isBasicsOnly ? 'Pro feature' : 'Multi-slide images'}</p>
            </div>
          </div>
          <Switch checked={carousel} onCheckedChange={setCarousel} disabled={isBasicsOnly} />
        </div>
      </div>

      {carousel && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Number of Slides</Label>
            <Select value={String(carouselSlides)} onValueChange={(v) => setCarouselSlides(Number(v))}>
              <SelectTrigger className="bg-secondary/50 border-border h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} slides</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Slide Format</Label>
            <Select value={carouselFormat} onValueChange={setCarouselFormat}>
              <SelectTrigger className="bg-secondary/50 border-border h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="square">Square (1:1)</SelectItem>
                <SelectItem value="vertical">Vertical (9:16)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || !topic.trim()}
        className="w-full h-12 text-base font-bold gradient-btn rounded-xl transition-all duration-200 disabled:opacity-40 border-0"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Content
          </span>
        )}
      </Button>
    </form>
  );
};

export default InputForm;
