import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Poll, PollVoteResponse } from '@/types/poll';
import pollService from '@/services/api/pollService';
import { useToast } from '@/hooks/use-toast';
import { usePollSync } from './usePollSync';

export function usePoll() {
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para buscar a enquete ativa
  const {
    data: poll,
    isLoading,
    error,
    refetch
  } = useQuery<Poll, Error>({
    queryKey: ['active-poll'],
    queryFn: pollService.getActivePoll,
    staleTime: 30000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos (novo nome para cacheTime)
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Sincronização em tempo real
  usePollSync({
    enabled: !!poll,
    interval: 30000 // 30 segundos
  });

  // Mutation para votar
  const voteMutation = useMutation<
    PollVoteResponse,
    Error,
    { pollId: string; optionId: string },
    { previousPoll: Poll | undefined }
  >({
    mutationFn: ({ pollId, optionId }) => pollService.vote(pollId, optionId),
    onMutate: async ({ pollId, optionId }) => {
      await queryClient.cancelQueries({ queryKey: ['active-poll'] });
      const previousPoll = queryClient.getQueryData<Poll>(['active-poll']);

      if (previousPoll) {
        queryClient.setQueryData<Poll>(['active-poll'], {
          ...previousPoll,
          opcoes: previousPoll.opcoes.map(opt =>
            opt.id === optionId ? { ...opt, votos: opt.votos + 1 } : opt
          ),
          total: previousPoll.total + 1
        });
      }

      return { previousPoll };
    },
    onSuccess: (data, { pollId }) => {
      toast({
        title: "Voto registrado!",
        description: "Obrigado por participar da enquete.",
        duration: 3000
      });
      
      if (data.data.poll) {
        queryClient.setQueryData(['active-poll'], data.data.poll);
      }
      
      setShowResults(true);
    },
    onError: (err, { pollId }, context) => {
      if (context?.previousPoll) {
        queryClient.setQueryData(['active-poll'], context.previousPoll);
      }
      
      toast({
        title: "Erro ao votar",
        description: "Não foi possível registrar seu voto. Tente novamente.",
        variant: "destructive",
        duration: 5000
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['active-poll'] });
    }
  });

  // Verificar se já votou ao carregar
  useEffect(() => {
    if (poll?.id) {
      const hasVoted = pollService.hasVoted(poll.id);
      if (hasVoted) {
        setShowResults(true);
      }
    }
  }, [poll?.id]);

  const handleVote = async (optionId: string) => {
    if (!poll) return;
    
    if (pollService.hasVoted(poll.id)) {
      toast({
        title: "Você já votou",
        description: "Aguarde a próxima enquete para participar novamente.",
        variant: "default",
        duration: 3000
      });
      setShowResults(true);
      return;
    }

    voteMutation.mutate({ pollId: poll.id, optionId });
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  return {
    poll,
    isLoading,
    error,
    showResults,
    hasVoted: poll ? pollService.hasVoted(poll.id) : false,
    votedOptionId: poll ? pollService.getVotedOption(poll.id) : null,
    isVoting: voteMutation.isPending, // Novo nome para isLoading no Tanstack Query v5
    handleVote,
    toggleResults,
    refetch
  };
} 