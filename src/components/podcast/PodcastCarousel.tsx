import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Youtube, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { Section } from "@/components/layout/Section";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PodcastItem } from "@/types/podcast";
import useEmblaCarousel from 'embla-carousel-react';
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

interface PodcastCarouselProps {
  podcasts: PodcastItem[];
}

export function PodcastCarousel({ podcasts }: PodcastCarouselProps) {
  const navigate = useNavigate();
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastItem | null>(null);
  const { isMobile } = useDeviceDetection();
  
  // Embla carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    skipSnaps: false,
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(true);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <Section className="py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold">Podcasts</h2>
        </div>
        <Button
          variant="ghost"
          className="text-primary flex items-center gap-1"
          onClick={() => navigate("/podcast")}
        >
          Ver todos
          <ArrowRight size={16} />
        </Button>
      </div>

      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 -ml-4">
            {podcasts.map((podcast) => (
              <div key={podcast.id} className="flex-none pl-4" style={{ width: isMobile ? '85%' : '300px' }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <TouchFeedback
                    onClick={() => setSelectedPodcast(podcast)}
                    className="relative overflow-hidden rounded-xl bg-card shadow-lg border border-border/10"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={podcast.thumb_url}
                        alt={podcast.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white shadow-lg">
                          <Youtube size={14} />
                          YouTube
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm shadow-xl transform hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 text-primary ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium line-clamp-2 mb-2 text-base">{podcast.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(podcast.created_at), "d 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </TouchFeedback>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {!isMobile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border border-border/20 transition-opacity duration-200 ${
                !prevBtnEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background/90'
              }`}
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border border-border/20 transition-opacity duration-200 ${
                !nextBtnEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background/90'
              }`}
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      <Dialog open={!!selectedPodcast} onOpenChange={() => setSelectedPodcast(null)}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${selectedPodcast?.id}?autoplay=1`}
              title={selectedPodcast?.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-medium mb-2">{selectedPodcast?.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {selectedPodcast?.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
} 