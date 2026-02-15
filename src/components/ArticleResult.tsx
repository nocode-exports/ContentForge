import { Copy, Check, RefreshCw, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface SectionImage {
  section: string;
  imagePrompt: string;
}

interface ArticleResultProps {
  headline: string;
  post: string;
  hashtags: string[];
  cta: string;
  sectionImages: SectionImage[];
  onRegenerate: () => void;
  isRegenerating: boolean;
}

const ArticleResult = ({ headline, post, hashtags, cta, sectionImages, onRegenerate, isRegenerating }: ArticleResultProps) => {
  const [copied, setCopied] = useState(false);

  const fullText = `# ${headline}\n\n${post}\n\n${hashtags.map((h) => `#${h}`).join(" ")}\n\n${cta}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Article copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown rendering
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return <h4 key={i} className="text-base font-bold text-foreground mt-4 mb-1">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={i} className="text-lg font-bold text-foreground mt-5 mb-2">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="text-foreground/90 ml-4 list-disc leading-relaxed">
            {line.replace(/^[-*] /, "")}
          </li>
        );
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-foreground/90 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="glass-card p-6 md:p-8 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">📝 Full Article</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isRegenerating} className="text-muted-foreground hover:text-foreground">
            {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Headline</span>
        <h2 className="text-2xl font-extrabold text-foreground leading-tight">{headline}</h2>
      </div>

      <div className="prose prose-sm max-w-none">
        {renderMarkdown(post)}
      </div>

      {sectionImages.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> Image Suggestions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sectionImages.map((si, i) => (
              <div key={i} className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                <p className="text-xs font-semibold text-foreground mb-1">{si.section}</p>
                <p className="text-xs text-muted-foreground">{si.imagePrompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag, i) => (
          <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
            #{tag}
          </span>
        ))}
      </div>

      <p className="text-foreground/80 italic text-sm">{cta}</p>

      <Button onClick={handleCopy} className="w-full gradient-btn rounded-xl border-0">
        {copied ? (
          <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Copied!</span>
        ) : (
          <span className="flex items-center gap-2"><Copy className="h-4 w-4" /> Copy Full Article</span>
        )}
      </Button>
    </div>
  );
};

export default ArticleResult;
