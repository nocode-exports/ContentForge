import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { History, Trash2, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  topic: string;
  platform: string;
  tone: string;
  template: string | null;
  headline: string;
  post: string;
  hashtags: string[];
  cta: string | null;
  image_prompt: string | null;
  image_url: string | null;
  created_at: string;
}

interface HistoryPanelProps {
  onLoad: (item: HistoryItem) => void;
}

const HistoryPanel = ({ onLoad }: HistoryPanelProps) => {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("content_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error(error);
    } else {
      setItems(data as HistoryItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("content_history").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted");
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-5 space-y-3">
        <h4 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> History
        </h4>
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-3">
      <h4 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
        <History className="h-4 w-4 text-primary" /> History
        <span className="text-xs text-muted-foreground font-normal ml-auto">{items.length} items</span>
      </h4>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No generated content yet.</p>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => onLoad(item)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.topic}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                    <span className="mx-1">·</span>
                    {item.platform}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default HistoryPanel;
