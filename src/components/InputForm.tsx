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
];

const templates = [
  { value: "none", label: "No template" },
  { value: "quote", label: "Quote" },
  { value: "announcement", label: "Announcement" },
  { value: "educational", label: "Educational" },
];

const InputForm = ({ onGenerate, isLoading, userTier = "free" }: InputFormProps) => {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [template, setTemplate] = useState("none");

  const isFree = userTier === "free";
  const isStarter = userTier === "starter";
  const isBasicsOnly = isFree || isStarter;

  const availablePlatforms = isFree
    ? platforms.filter(p => ["facebook", "instagram", "twitter"].includes(p.value))
    : platforms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate({ topic, platform, tone, template, fullArticle: false, carousel: false, carouselSlides: 5, carouselFormat: "square" });
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
