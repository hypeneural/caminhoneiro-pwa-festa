import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Clock, MapPin, Music2, Navigation, Route, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const processionMoments = [
  {
    time: "07:30",
    title: "Cafe da manha",
    detail: "Acolhida na comunidade",
    icon: Utensils,
    tone: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    time: "09:00",
    title: "Procissao automotiva",
    detail: "Saida da Capela Santa Teresinha",
    icon: Navigation,
    tone: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    time: "12:00",
    title: "Almoco festivo",
    detail: "Bar e cozinha completos",
    icon: Utensils,
    tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    time: "14:00",
    title: "Tarde dancante",
    detail: "Andre e Cristiano",
    icon: Music2,
    tone: "bg-rose-100 text-rose-800 border-rose-200",
  },
];

const vibrate = () => {
  if ("vibrate" in navigator) navigator.vibrate(12);
};

export const HomeProcessionCard = () => {
  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge className="mb-2 border-white/20 bg-white/12 text-white hover:bg-white/12">
              Domingo 19/07
            </Badge>
            <h2 className="text-lg font-bold leading-tight">Procissao de Sao Cristovao</h2>
            <p className="mt-1 text-sm text-white/75">Rota automotiva, almoco e tarde dancante.</p>
          </div>

          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/12"
          >
            <Route className="h-6 w-6 text-yellow-300" />
          </motion.div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg bg-white/10 p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Clock className="h-3.5 w-3.5" />
              Proximo grande momento
            </div>
            <p className="mt-1 truncate text-sm font-semibold">09:00 - Procissao automotiva</p>
          </div>

          <Link to="/rota-completa" onClick={vibrate} aria-label="Ver rota completa da procissao">
            <Button size="sm" className="h-10 rounded-lg bg-yellow-400 px-3 text-slate-950 hover:bg-yellow-300">
              <Navigation className="mr-1.5 h-4 w-4" />
              Rota
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {processionMoments.map((moment) => {
            const Icon = moment.icon;

            return (
              <motion.div
                key={`${moment.time}-${moment.title}`}
                whileTap={{ scale: 0.97 }}
                onTap={vibrate}
                className="min-w-[168px] snap-start rounded-lg border border-border/70 bg-background p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">{moment.time}</span>
                  <span className={`rounded-full border p-1.5 ${moment.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-tight text-foreground">{moment.title}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{moment.detail}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link to="/programacao" onClick={vibrate}>
            <Button variant="outline" className="h-11 w-full rounded-lg justify-between px-3">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Agenda
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>

          <Link to="/mapa" onClick={vibrate}>
            <Button variant="outline" className="h-11 w-full rounded-lg justify-between px-3">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Mapa
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
