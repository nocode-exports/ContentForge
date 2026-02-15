import { useState, useRef } from "react";
import { Download, RefreshCw, Loader2, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CarouselSlide {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  imagePrompt: string;
  imageUrl?: string | null;
}

interface CarouselResultProps {
  headline: string;
  slides: CarouselSlide[];
  format: string;
  isGeneratingImages: boolean;
  onRegenerateSlide: (slideIndex: number) => void;
}

const CarouselResult = ({ headline, slides, format, isGeneratingImages, onRegenerateSlide }: CarouselResultProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const scroll = (dir: number) => {
    if (!scrollRef.current) return;
    const slideWidth = format === "vertical" ? 240 : 300;
    scrollRef.current.scrollBy({ left: dir * (slideWidth + 16), behavior: "smooth" });
  };

  const handleDownloadAll = async () => {
    for (const slide of slides) {
      if (!slide.imageUrl) continue;
      const link = document.createElement("a");
      link.href = slide.imageUrl;
      link.download = `carousel-slide-${slide.slideNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast.success("All slides downloaded!");
  };

  const aspectClass = format === "vertical" ? "aspect-[9/16]" : "aspect-square";
  const slideWidth = format === "vertical" ? "w-[220px]" : "w-[280px]";

  return (
    <div className="glass-card p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" /> Carousel Preview
        </h3>
        <span className="text-xs text-muted-foreground">{slides.length} slides</span>
      </div>

      <p className="text-sm font-semibold text-foreground">{headline}</p>

      {/* Horizontal scroll */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-card/80 backdrop-blur-sm border border-border/60 rounded-full shadow-md"
          onClick={() => scroll(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide px-8 py-2 snap-x snap-mandatory">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`${slideWidth} flex-shrink-0 snap-center cursor-pointer transition-all duration-200 ${activeSlide === i ? "scale-[1.02]" : "opacity-80"}`}
              onClick={() => setActiveSlide(i)}
            >
              <div className={`${aspectClass} rounded-2xl overflow-hidden bg-secondary/30 border-2 ${activeSlide === i ? "border-primary" : "border-border/40"} relative`}>
                {slide.imageUrl ? (
                  <img src={slide.imageUrl} alt={`Slide ${slide.slideNumber}`} className="w-full h-full object-cover" />
                ) : isGeneratingImages ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Generating...</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-2">
                    <div className="w-full space-y-2">
                      <p className="text-sm font-bold text-foreground text-center">{slide.title}</p>
                      {slide.bulletPoints.map((bp, j) => (
                        <p key={j} className="text-xs text-muted-foreground text-center">• {bp}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-foreground/80 text-background text-xs font-bold px-2 py-0.5 rounded-full">
                  {slide.slideNumber}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-card/80 backdrop-blur-sm border border-border/60 rounded-full shadow-md"
          onClick={() => scroll(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Slide detail */}
      {slides[activeSlide] && (
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">Slide {slides[activeSlide].slideNumber}: {slides[activeSlide].title}</p>
            <Button variant="ghost" size="sm" onClick={() => onRegenerateSlide(activeSlide)} className="text-muted-foreground hover:text-foreground h-7">
              <RefreshCw className="h-3 w-3 mr-1" /> Regen
            </Button>
          </div>
          <ul className="space-y-1">
            {slides[activeSlide].bulletPoints.map((bp, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {bp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`h-2 rounded-full transition-all duration-200 ${activeSlide === i ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`}
            onClick={() => setActiveSlide(i)}
          />
        ))}
      </div>

      <Button
        onClick={handleDownloadAll}
        disabled={!slides.some((s) => s.imageUrl)}
        className="w-full gradient-btn rounded-xl border-0 disabled:opacity-30"
      >
        <span className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Download All Slides
        </span>
      </Button>
    </div>
  );
};

export default CarouselResult;
