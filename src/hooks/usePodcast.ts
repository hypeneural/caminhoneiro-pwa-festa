import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { PodcastItem } from '@/types/podcast';

interface UsePodcastProps {
  filters: {
    limit: number;
    page: number;
    sort: string;
    order: 'ASC' | 'DESC';
  };
  initialLoad?: boolean;
}

interface PodcastResponse {
  status: string;
  message: string;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  data: PodcastItem[];
}

export function usePodcast({ filters, initialLoad = true }: UsePodcastProps) {
  const [items, setItems] = useState<PodcastItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [meta, setMeta] = useState<PodcastResponse['meta'] | null>(null);

  const fetchPodcasts = async (params = filters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<PodcastResponse>('/podcast', { params });
      
      if (response.data.status === 'success') {
        let { data, meta } = response.data;
        // Filtro manual por nome se search estiver presente
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          data = data.filter(p => p.title.toLowerCase().includes(searchLower));
        }
        // Ordenação manual se necessário
        if (params.sort === 'created_at') {
          data = data.slice().sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return params.order === 'ASC' ? dateA - dateB : dateB - dateA;
          });
        }
        setItems(prev => params.page === 1 ? data : [...prev, ...data]);
        setMeta(meta);
        setHasMore(meta.page * meta.limit < meta.total);
      } else {
        setError('Erro ao carregar podcasts');
      }
    } catch (err) {
      setError('Erro ao carregar podcasts');
      console.error('Error fetching podcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchPodcasts({
        ...filters,
        page: (meta?.page || 1) + 1
      });
    }
  };

  const refresh = async () => {
    await fetchPodcasts({ ...filters, page: 1 });
  };

  useEffect(() => {
    if (initialLoad) {
      fetchPodcasts();
    }
  }, [filters.sort, filters.order, filters.limit, initialLoad]);

  return {
    items,
    loading,
    error,
    hasMore,
    meta,
    loadMore,
    refresh,
    fetchPodcasts
  };
}