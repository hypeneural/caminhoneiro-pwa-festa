import React, { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Button } from '@/components/ui/button';
import { usePoll } from '@/hooks/usePoll';
import { cn } from '@/lib/utils';

// Lazy load do gráfico para reduzir bundle inicial
const PieChart = lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);
const Pie = lazy(() => 
  import('recharts').then(module => ({ default: module.Pie }))
);
const Cell = lazy(() => 
  import('recharts').then(module => ({ default: module.Cell }))
);

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

interface PollCardProps {
  className?: string;
}

export function PollCard({ className }: PollCardProps) {
  const {
    poll,
    isLoading,
    error,
    showResults,
    hasVoted,
    votedOptionId,
    isVoting,
    handleVote,
    toggleResults
  } = usePoll();

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
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
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
                  >
                    <div
                      className={cn(
                        "p-4 rounded-lg border transition-colors",
                        votedOptionId === opcao.id && "bg-primary/10 border-primary",
                        !hasVoted && !isVoting && "hover:bg-muted/50",
                        "relative overflow-hidden"
                      )}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <span className="font-medium">{opcao.texto}</span>
                        {votedOptionId === opcao.id && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                        {isVoting && votedOptionId === opcao.id && (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        )}
                      </div>
                      {hasVoted && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(opcao.votos / poll.total) * 100}%` }}
                          className="absolute inset-0 bg-primary/5"
                          style={{ originX: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                      )}
                    </div>
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
            >
              {poll.opcoes.map((opcao, index) => (
                <div key={opcao.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{opcao.texto}</span>
                    <span>
                      {opcao.votos} voto{opcao.votos !== 1 ? 's' : ''} (
                      {((opcao.votos / poll.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <Progress
                    value={(opcao.votos / poll.total) * 100}
                    className={cn(
                      "h-2",
                      `bg-[${COLORS[index % COLORS.length]}]/20`
                    )}
                  />
                </div>
              ))}

              {poll.total > 0 && (
                <Suspense fallback={<div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>}>
                  <div className="flex justify-center pt-4">
                    <PieChart width={200} height={200}>
                      <Pie
                        data={chartData}
                        cx={100}
                        cy={100}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                </Suspense>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="outline"
          className="w-full"
          onClick={toggleResults}
          disabled={!hasVoted && isVoting}
        >
          {showResults ? "Voltar para Votação" : "Ver Resultados"}
        </Button>

        {poll.encerraEm && (
          <p className="text-xs text-center text-muted-foreground">
            Enquete encerra em: {new Date(poll.encerraEm).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
