import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Navigation, Clock } from 'lucide-react';
import { useTraccarData } from '@/hooks/useTraccarData';

export const LiveRouteBanner: React.FC = () => {
  return null;

  // 1. Expirar após Dia 19/07/2026 às 14:00h (Horário de Brasília)
  // Brasília é UTC-3. Criamos o limite bloqueado no fuso -03:00.
  const eventEndTimeLimit = new Date('2026-07-19T14:00:00-03:00');
  const now = new Date();

  if (now > eventEndTimeLimit) {
    return null;
  }

  // 2. Só aparece se a atualização for recente (menos de 30 minutos)
  const lastUpdateDate = new Date(trackerData.deviceTime);
  
  if (isNaN(lastUpdateDate.getTime())) {
    return null;
  }

  const diffInMinutes = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60);

  if (diffInMinutes > 30 || diffInMinutes < -5) {
    return null;
  }

  return (
    <div className="px-4 pt-4 pb-2 bg-background animate-fade-in">
      <Link to="/rota-completa" className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 p-[1.5px] shadow-lg shadow-red-500/20 active:scale-[0.99] transition-transform animate-border-glow">
          <div className="flex items-center justify-between rounded-[14px] bg-zinc-950/95 backdrop-blur-md px-4 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/25">
                {trackerData.connectionStatus.state === 'live' ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                ) : trackerData.connectionStatus.state === 'delayed' ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                ) : (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
                  </span>
                )}
                <Radio className="h-5 w-5 text-red-500 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black tracking-wider text-red-500 uppercase flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  ROTA EM TEMPO REAL
                </div>
                <div className="text-sm font-black text-white leading-tight uppercase tracking-wide truncate">
                  Procissão ao Vivo
                </div>
                <div className="text-[9.5px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/75 shrink-0" />
                  Atualizado há {Math.max(0, Math.floor(diffInMinutes))} min ({lastUpdateDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] font-black text-red-400 group-hover:bg-red-500/20 transition-colors shrink-0">
              Acompanhar
              <Navigation className="h-3 w-3 rotate-45 ml-0.5" />
            </div>
          </div>
        </div>
      </Link>
      <style>{`
        @keyframes border-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.3); border-color: rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.6); border-color: rgba(239, 68, 68, 0.8); }
        }
        .animate-border-glow {
          animation: border-glow 1.8s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
