
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, BarChart3 } from 'lucide-react';
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

export function PollCard({ pollId = "truck-fest-2025", className }: PollCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();

  // Recuperar estado do localStorage
  useEffect(() => {
    const savedVote = localStorage.getItem(`poll-vote-${pollId}`);
    if (savedVote) {
      const { hasVoted: voted, optionId } = JSON.parse(savedVote);
      setHasVoted(voted);
      setVotedOptionId(optionId);
      setShowResults(voted);
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
      // Mock - substituir pela API real
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simular erro ocasional para testar rollback
      if (Math.random() < 0.1) {
        throw new Error('Erro de rede');
      }
      
      return { success: true, optionId };
    },
    onMutate: async (optionId: string) => {
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
      // Rollback em caso de erro
      if (context?.previousPoll) {
        queryClient.setQueryData(['poll', pollId], context.previousPoll);
      }
      console.error('Erro ao votar:', err);
    },
    onSuccess: (data, optionId) => {
      // Salvar voto no localStorage
      localStorage.setItem(`poll-vote-${pollId}`, JSON.stringify({
        hasVoted: true,
        optionId,
        timestamp: Date.now()
      }));
      
      setHasVoted(true);
      setVotedOptionId(optionId);
      setShowResults(true);
    },
  });

  const handleVote = (optionId: string) => {
    if (hasVoted || voteMutation.isPending) return;
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
                  whileTap={{ scale: 0.97 }}
                >
                  <TouchFeedback
                    onClick={() => handleVote(opcao.id)}
                    disabled={hasVoted || voteMutation.isPending}
                    haptic={true}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-start text-left hover:bg-trucker-blue/10 hover:border-trucker-blue/50 transition-all duration-200"
                      disabled={hasVoted || voteMutation.isPending}
                    >
                      <span className="font-medium">{opcao.texto}</span>
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
                        "p-3 rounded-lg border-2 transition-all duration-300",
                        isVoted 
                          ? "border-trucker-blue bg-trucker-blue/5" 
                          : "border-border/50"
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={cn(
                          "font-medium text-sm",
                          isVoted && "text-trucker-blue"
                        )}>
                          {opcao.texto}
                          {isVoted && " ✓"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {percentage}% ({opcao.votos})
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        aria-label={`${opcao.texto}: ${percentage}% dos votos`}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Gráfico de pizza */}
              {poll.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-muted/30 rounded-xl p-4"
                  layout
                >
                  <Suspense fallback={
                    <div className="h-48 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin" />
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
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {voteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando voto...
              </>
            ) : hasVoted ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                Voto registrado
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                {poll.total} votos
              </>
            )}
          </div>

          {hasVoted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleResults}
              className="text-trucker-blue hover:bg-trucker-blue/10"
            >
              {showResults ? 'Ver opções' : 'Ver resultados'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
