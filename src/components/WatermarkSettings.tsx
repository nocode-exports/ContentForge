import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X, Type, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface WatermarkConfig {
  enabled: boolean;
  type: "text" | "logo";
  text: string;
  logoUrl: string | null;
  position: string;
  opacity: number;
}

interface WatermarkSettingsProps {
  config: WatermarkConfig;
  onChange: (config: WatermarkConfig) => void;
}

const positions = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "center", label: "Center" },
];

const WatermarkSettings = ({ config, onChange }: WatermarkSettingsProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const update = (partial: Partial<WatermarkConfig>) => {
    onChange({ ...config, ...partial });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("watermark-logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("watermark-logos").getPublicUrl(path);
      update({ logoUrl: data.publicUrl, type: "logo" });
      toast.success("Logo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" /> Watermark
        </h4>
        <Switch checked={config.enabled} onCheckedChange={(v) => update({ enabled: v })} />
      </div>

      {config.enabled && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={config.type === "text" ? "default" : "outline"}
              onClick={() => update({ type: "text" })}
              className="flex-1 text-xs"
            >
              <Type className="h-3 w-3 mr-1" /> Text
            </Button>
            <Button
              type="button"
              size="sm"
              variant={config.type === "logo" ? "default" : "outline"}
              onClick={() => update({ type: "logo" })}
              className="flex-1 text-xs"
            >
              <ImageIcon className="h-3 w-3 mr-1" /> Logo
            </Button>
          </div>

          {config.type === "text" ? (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Watermark Text</Label>
              <Input
                value={config.text}
                onChange={(e) => update({ text: e.target.value })}
                placeholder="Your brand name"
                className="bg-secondary/50 border-border/50 h-9 text-sm"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Upload Logo</Label>
              {config.logoUrl ? (
                <div className="flex items-center gap-2">
                  <img src={config.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />
                  <span className="text-xs text-muted-foreground flex-1 truncate">Logo uploaded</span>
                  <Button size="sm" variant="ghost" onClick={() => update({ logoUrl: null })} className="h-7 w-7 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-secondary/50 border border-border/50 cursor-pointer hover:bg-secondary/70 transition-colors text-xs text-muted-foreground">
                  <Upload className="h-3 w-3" />
                  {uploading ? "Uploading..." : "Choose file"}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Position</Label>
              <Select value={config.position} onValueChange={(v) => update({ position: v })}>
                <SelectTrigger className="bg-secondary/50 border-border/50 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {positions.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Opacity ({Math.round(config.opacity * 100)}%)</Label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={config.opacity}
                onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-primary h-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatermarkSettings;
