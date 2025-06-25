
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, BarChart3, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { pollMock, Poll, PollOption } from '@/data/pollData';
import { usePollSync } from '@/hooks/usePollSync';
import { cn } from '@/lib/utils';

// Lazy load do gráfico para reduzir bundle inicial
const PieChart = lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);
const Cell = lazy(() => 
  import('recharts').then(module => ({ default: module.Cell }))
);

interface PollCardProps {
  pollId?: string;
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

// Chave para cache local
const POLL_CACHE_KEY = 'poll-votes-cache';

interface PollVoteCache {
  [pollId: string]: {
    hasVoted: boolean;
    votedOptionId: string;
    timestamp: number;
    expiresAt?: number;
  };
}

export function PollCard({ pollId = "truck-fest-2025", className }: PollCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const queryClient = useQueryClient();

  // Funções para cache local
  const getCacheData = (): PollVoteCache => {
    try {
      const cached = localStorage.getItem(POLL_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  };

  const setCacheData = (data: PollVoteCache) => {
    try {
      localStorage.setItem(POLL_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Erro ao salvar cache da enquete:', error);
    }
  };

  const saveVoteToCache = (pollId: string, optionId: string) => {
    const cache = getCacheData();
    cache[pollId] = {
      hasVoted: true,
      votedOptionId: optionId,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
    };
    setCacheData(cache);
  };

  const getVoteFromCache = (pollId: string) => {
    const cache = getCacheData();
    const vote = cache[pollId];
    
    if (!vote) return null;
    
    // Verificar se o voto expirou
    if (vote.expiresAt && Date.now() > vote.expiresAt) {
      delete cache[pollId];
      setCacheData(cache);
      return null;
    }
    
    return vote;
  };

  // Recuperar estado do cache ao carregar
  useEffect(() => {
    const cachedVote = getVoteFromCache(pollId);
    if (cachedVote) {
      setHasVoted(true);
      setVotedOptionId(cachedVote.votedOptionId);
      setShowResults(true);
    }
  }, [pollId]);

  // Query para buscar dados da enquete
  const { 
    data: poll, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['poll', pollId],
    queryFn: async (): Promise<Poll> => {
      // Mock - substituir pela API real
      await new Promise(resolve => setTimeout(resolve, 300));
      return pollMock;
    },
    staleTime: 30000, // 30 segundos
    retry: 3,
  });

  // Sync em tempo real
  usePollSync({ pollId, enabled: !!poll });

  // Mutation para votar
  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      setIsVoting(true);
      // Mock - substituir pela API real
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simular erro ocasional para testar rollback
      if (Math.random() < 0.05) { // Reduzido para 5%
        throw new Error('Erro de rede');
      }
      
      return { success: true, optionId };
    },
    onMutate: async (optionId: string) => {
      setIsVoting(true);
      
      // Otimização otimista
      await queryClient.cancelQueries({ queryKey: ['poll', pollId] });
      
      const previousPoll = queryClient.getQueryData<Poll>(['poll', pollId]);
      
      if (previousPoll) {
        const updatedOpcoes = previousPoll.opcoes.map(opcao => 
          opcao.id === optionId 
            ? { ...opcao, votos: opcao.votos + 1 }
            : opcao
        );
        
        queryClient.setQueryData(['poll', pollId], {
          ...previousPoll,
          opcoes: updatedOpcoes,
          total: previousPoll.total + 1
        });
      }
      
      return { previousPoll };
    },
    onError: (err, optionId, context) => {
      setIsVoting(false);
      
      // Rollback em caso de erro
      if (context?.previousPoll) {
        queryClient.setQueryData(['poll', pollId], context.previousPoll);
      }
      
      console.error('Erro ao votar:', err);
    },
    onSuccess: (data, optionId) => {
      setIsVoting(false);
      
      // Salvar no cache local
      saveVoteToCache(pollId, optionId);
      
      setHasVoted(true);
      setVotedOptionId(optionId);
      setShowResults(true);
    },
  });

  const handleVote = (optionId: string) => {
    if (hasVoted || isVoting) return;
    voteMutation.mutate(optionId);
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  if (isLoading) {
    return (
      <Card className={cn("rounded-2xl shadow-lg bg-white dark:bg-zinc-800", className)}>
        <CardHeader className="pb-4">
          <div className="h-6 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !poll) {
    return (
      <Card className={cn("rounded-2xl shadow-lg bg-white dark:bg-zinc-800", className)}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Erro ao carregar enquete</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = poll.opcoes.map((opcao, index) => ({
    name: opcao.texto,
    value: opcao.votos,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <Card className={cn("rounded-2xl shadow-lg bg-white dark:bg-zinc-800 overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-trucker-blue" />
          {poll.pergunta}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="voting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {poll.opcoes.map((opcao, index) => (
                <motion.div
                  key={opcao.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TouchFeedback
                    onClick={() => handleVote(opcao.id)}
                    disabled={hasVoted || isVoting}
                    haptic={true}
                    className="w-full"
                    scale={0.98}
                  >
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-14 justify-start text-left font-medium text-base",
                        "hover:bg-trucker-blue/10 hover:border-trucker-blue/50",
                        "transition-all duration-300 ease-out",
                        "active:scale-[0.98] active:bg-trucker-blue/20",
                        isVoting && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={hasVoted || isVoting}
                    >
                      <span className="flex-1">{opcao.texto}</span>
                      {isVoting && (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      )}
                    </Button>
                  </TouchFeedback>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
              layout
            >
              {/* Barras de progresso */}
              <div className="space-y-3" aria-live="polite">
                {poll.opcoes.map((opcao, index) => {
                  const percentage = poll.total > 0 ? Math.round((opcao.votos / poll.total) * 100) : 0;
                  const isVoted = opcao.id === votedOptionId;
                  
                  return (
                    <motion.div
                      key={opcao.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-300",
                        isVoted 
                          ? "border-trucker-blue bg-trucker-blue/10 shadow-md" 
                          : "border-border/50 bg-muted/20"
                      )}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-semibold text-sm",
                            isVoted && "text-trucker-blue"
                          )}>
                            {opcao.texto}
                          </span>
                          {isVoted && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <Check className="w-4 h-4 text-trucker-blue" />
                            </motion.div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {percentage}% ({opcao.votos})
                        </span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
                      >
                        <Progress 
                          value={percentage} 
                          className={cn(
                            "h-3",
                            isVoted && "bg-trucker-blue/20"
                          )}
                          aria-label={`${opcao.texto}: ${percentage}% dos votos`}
                        />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Gráfico de pizza */}
              {poll.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-4"
                  layout
                >
                  <Suspense fallback={
                    <div className="h-48 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-trucker-blue" />
                    </div>
                  }>
                    <div className="h-48 flex items-center justify-center">
                      <PieChart width={200} height={200}>
                        {/* Chart components will be rendered here */}
                      </PieChart>
                    </div>
                  </Suspense>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer com status */}
        <motion.div 
          className="flex items-center justify-between pt-4 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isVoting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-trucker-blue" />
                <span className="font-medium">Enviando voto...</span>
              </>
            ) : hasVoted ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-600">Voto registrado</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>{poll.total} votos</span>
              </>
            )}
          </div>

          {hasVoted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleResults}
              className="text-trucker-blue hover:bg-trucker-blue/10 font-medium"
            >
              {showResults ? 'Ver opções' : 'Ver resultados'}
            </Button>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
