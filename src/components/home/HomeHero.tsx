import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Navigation, Route, Sparkles, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { eventDays, getEventDateTime, getNextEvent, scheduleSummary } from "@/data/programacao";
import { useCountdown } from "@/hooks/useCountdown";

const posterImage = "/assets/images/programacao/sao-cristovao-2026.png";

const quickMoments = [
  { icon: Clock, label: "Sáb 18h", value: "Missa" },
  { icon: Ticket, label: "19h40", value: "Bingo" },
  { icon: Route, label: "Dom 9h", value: "Procissão" }
];

export function HomeHero() {
  const nextEvent = getNextEvent();
  const targetDate = nextEvent ? getEventDateTime(nextEvent.event) : new Date(eventDays.saturday.isoDate + "T18:00:00");
  const countdown = useCountdown(targetDate, { precision: "minute" });

  const countdownLabel = countdown.isPast
    ? "Festa em andamento"
    : `${countdown.days > 0 ? `${countdown.days}d ` : ""}${countdown.hours}h ${countdown.minutes}m`;

  return (
    <section className="relative overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0">
        <img
          src={posterImage}
          alt=""
          className="h-full w-full object-cover object-top opacity-65"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.72)_52%,rgba(2,6,23,0.98)_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative px-4 pb-5 pt-8"
      >
        <div className="mb-16 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-xs font-bold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            {scheduleSummary.edition} 2026
          </div>
          <div className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold backdrop-blur-md">
            {countdownLabel}
          </div>
        </div>

        <div className="max-w-[22rem]">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-200">
            <CalendarDays className="h-4 w-4" />
            {scheduleSummary.dateRange}
          </p>
          <h1 className="text-3xl font-black leading-[1.05] tracking-normal">
            Festa de São Cristóvão
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/84">
            Capela Santa Teresinha, bairro Universitário. Fé, procissão, bingo, almoço e tarde dançante com a comunidade.
          </p>
        </div>

        {nextEvent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="mt-5 rounded-2xl border border-white/14 bg-white/12 p-3 backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase text-white/62">Próximo momento</span>
              <span className="rounded-full bg-yellow-300 px-2 py-1 text-[11px] font-black text-zinc-950">
                {nextEvent.event.time}
              </span>
            </div>
            <div className="font-bold leading-tight">{nextEvent.event.title}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
              <MapPin className="h-3.5 w-3.5" />
              {nextEvent.event.location}
            </div>
          </motion.div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          {quickMoments.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.28 }}
                className="rounded-2xl border border-white/12 bg-white/10 p-3 backdrop-blur-md"
              >
                <Icon className="mb-2 h-4 w-4 text-yellow-300" />
                <div className="text-xs font-black">{item.label}</div>
                <div className="mt-0.5 text-[11px] text-white/70">{item.value}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
          <Link to="/programacao" className="min-w-0">
            <Button className="h-12 w-full rounded-2xl bg-yellow-300 font-black text-zinc-950 shadow-lg shadow-black/20 hover:bg-yellow-200 active:scale-[0.98]">
              <CalendarDays className="mr-2 h-5 w-5" />
              Programação
            </Button>
          </Link>
          <Link to="/mapa">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-2xl border-white/25 bg-white/12 text-white backdrop-blur-md hover:bg-white/20 active:scale-[0.96]"
              aria-label="Como chegar na Capela Santa Teresinha"
            >
              <Navigation className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
