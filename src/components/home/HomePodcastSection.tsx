import { PodcastCarousel } from "@/components/podcast/PodcastCarousel";
import { usePodcast } from "@/hooks/usePodcast";

export function HomePodcastSection() {
  const { items: podcasts, loading } = usePodcast({
    filters: {
      limit: 5,
      page: 1,
      sort: "created_at",
      order: "DESC"
    },
    initialLoad: true
  });

  if (loading || podcasts.length === 0) {
    return null;
  }

  return <PodcastCarousel podcasts={podcasts} />;
}
