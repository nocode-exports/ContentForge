import { useRef, useCallback } from "react";
import { Download, RefreshCw, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { WatermarkConfig } from "@/components/WatermarkSettings";

interface ImageResultProps {
  imageUrl: string | null;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  watermark?: WatermarkConfig;
}

const ImageResult = ({
  imageUrl,
  aspectRatio,
  onAspectRatioChange,
  onRegenerate,
  isGenerating,
  watermark,
}: ImageResultProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyWatermark = useCallback(
    (img: HTMLImageElement): string => {
      const canvas = canvasRef.current;
      if (!canvas || !watermark?.enabled) return img.src;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return img.src;

      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = watermark.opacity;

      const padding = Math.min(canvas.width, canvas.height) * 0.04;
      const pos = watermark.position;

      if (watermark.type === "text" && watermark.text) {
        const fontSize = Math.max(16, Math.min(canvas.width, canvas.height) * 0.04);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = "white";
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 2;
        const metrics = ctx.measureText(watermark.text);
        let x = padding;
        let y = canvas.height - padding;
        if (pos.includes("right")) x = canvas.width - metrics.width - padding;
        if (pos.includes("top")) y = fontSize + padding;
        if (pos === "center") {
          x = (canvas.width - metrics.width) / 2;
          y = canvas.height / 2;
        }
        ctx.strokeText(watermark.text, x, y);
        ctx.fillText(watermark.text, x, y);
      }

      ctx.globalAlpha = 1;
      return canvas.toDataURL("image/png");
    },
    [watermark]
  );

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let downloadUrl = imageUrl;
        if (watermark?.enabled) {
          downloadUrl = applyWatermark(img);
        }
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `social-content-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded!");
      };
      img.onerror = () => {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `social-content-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded!");
      };
      img.src = imageUrl;
    } catch {
      toast.error("Failed to download image");
    }
  };

  const aspectClasses: Record<string, string> = {
    square: "aspect-square",
    portrait: "aspect-[9/16]",
    landscape: "aspect-video",
  };

  return (
    <div className="glass-card p-6 space-y-5 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Generated Image</h3>
        <div className="flex gap-2">
          <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
            <SelectTrigger className="w-[120px] bg-secondary/50 border-border h-9 text-sm rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isGenerating} className="text-muted-foreground hover:text-foreground hover:bg-secondary/50">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className={`w-full max-h-[500px] ${aspectClasses[aspectRatio]} rounded-2xl overflow-hidden bg-secondary/30 flex items-center justify-center relative`}>
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Generating image...</span>
            </div>
          ) : imageUrl ? (
            <>
              <img src={imageUrl} alt="Generated social media content" className="w-full h-full object-cover" />
              {watermark?.enabled && watermark.type === "text" && watermark.text && (
                <WatermarkOverlay watermark={watermark} />
              )}
              {watermark?.enabled && watermark.type === "logo" && watermark.logoUrl && (
                <LogoWatermarkOverlay watermark={watermark} />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <ImageIcon className="h-12 w-12 opacity-30" />
              <span className="text-sm">Image will appear here</span>
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleDownload} disabled={!imageUrl || isGenerating} className="w-full gradient-btn rounded-xl border-0 disabled:opacity-30">
        <span className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Download Image
        </span>
      </Button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const positionClasses: Record<string, string> = {
  "bottom-right": "bottom-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "top-right": "top-2 right-2",
  "top-left": "top-2 left-2",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

const WatermarkOverlay = ({ watermark }: { watermark: WatermarkConfig }) => (
  <span
    className={`absolute ${positionClasses[watermark.position]} font-bold text-primary-foreground pointer-events-none select-none drop-shadow-lg`}
    style={{ opacity: watermark.opacity, fontSize: "clamp(12px, 3vw, 24px)" }}
  >
    {watermark.text}
  </span>
);

const LogoWatermarkOverlay = ({ watermark }: { watermark: WatermarkConfig }) => (
  <img
    src={watermark.logoUrl!}
    alt="Watermark"
    className={`absolute ${positionClasses[watermark.position]} pointer-events-none select-none drop-shadow-lg`}
    style={{ opacity: watermark.opacity, height: "clamp(24px, 8%, 64px)", width: "auto" }}
  />
);

export default ImageResult;
