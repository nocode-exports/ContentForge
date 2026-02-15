import { Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface TextResultProps {
  headline: string;
  post: string;
  hashtags: string[];
  cta: string;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

const TextResult = ({ headline, post, hashtags, cta, onRegenerate, isRegenerating }: TextResultProps) => {
  const [copied, setCopied] = useState(false);

  const fullText = `${headline}\n\n${post}\n\n${hashtags.map((h) => `#${h}`).join(" ")}\n\n${cta}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-6 space-y-5 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Generated Text</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isRegenerating} className="text-muted-foreground hover:text-foreground hover:bg-secondary/50">
            {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground hover:text-foreground hover:bg-secondary/50">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Headline</span>
          <p className="text-xl font-extrabold text-foreground leading-tight">{headline}</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Post</span>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{post}</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Hashtags</span>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Call to Action</span>
          <p className="text-foreground/80 italic">{cta}</p>
        </div>
      </div>

      <Button onClick={handleCopy} className="w-full gradient-btn rounded-xl border-0">
        {copied ? (
          <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Copied!</span>
        ) : (
          <span className="flex items-center gap-2"><Copy className="h-4 w-4" /> Copy All Text</span>
        )}
      </Button>
    </div>
  );
};

export default TextResult;
