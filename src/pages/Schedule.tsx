import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Car,
  CheckCircle2,
  Church,
  Clock,
  Coffee,
  HeartHandshake,
  MapPin,
  Music,
  RefreshCw,
  Sparkles,
  Thermometer,
  Ticket,
  Truck,
  Users,
  Utensils
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { NavigationActions } from "@/components/ui/navigation-actions";
import { WeatherEventCard } from "@/components/weather/WeatherEventCard";
import {
  EventDay,
  eventDays,
  scheduleSummary,
  getEventsByDay,
  getEventStatus,
  getEventTypeConfig,
  getNextEvent
} from "@/data/programacao";
import { useCountdown } from "@/hooks/useCountdown";
import { useWeather } from "@/hooks/useWeather";
import { BannerCarousel } from "@/components/sponsors/BannerCarousel";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import { LiveRouteBanner } from "@/components/tracker/LiveRouteBanner";

const posterImage = "/assets/images/programacao/sao-cristovao-2026.png";

const icons = {
  Church,
  Coffee,
  Truck,
  Music,
  Utensils,
  Ticket,
  MapPin,
  HeartHandshake,
  CalendarIcon,
  Clock
} as const;

const statusLabels = {
  current: "AO VIVO",
  past: "FINALIZADO",
  upcoming: "PROGRAMADO"
} as const;

const eventDayOrder: EventDay[] = ["saturday", "sunday"];

const dayToneClasses: Record<EventDay, { card: string; icon: string; badge: string; rail: string }> = {
  saturday: {
    card: "border-blue-200/70 bg-gradient-to-br from-blue-50/80 via-background to-yellow-50/80 dark:border-blue-800/60 dark:from-blue-950/50 dark:via-background dark:to-yellow-950/30",
    icon: "bg-gradient-to-br from-trucker-blue to-trucker-blue/80",
    badge: "border-trucker-blue/30 bg-trucker-blue/10 text-trucker-blue",
    rail: "from-trucker-blue/50 via-border to-trucker-yellow/60"
  },
  sunday: {
    card: "border-red-200/70 bg-gradient-to-br from-red-50/70 via-background to-emerald-50/70 dark:border-red-800/60 dark:from-red-950/40 dark:via-background dark:to-emerald-950/30",
    icon: "bg-gradient-to-br from-trucker-red to-trucker-red/80",
    badge: "border-trucker-red/30 bg-trucker-red/10 text-trucker-red",
    rail: "from-trucker-red/50 via-border to-trucker-green/60"
  }
};

const DynamicIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  const Icon = icons[iconName as keyof typeof icons] || CalendarIcon;
  return <Icon className={className} />;
};

const scheduleInfoCards = [
  {
    title: "Capela Santa Teresinha",
    description: scheduleSummary.neighborhood,
    icon: MapPin,
    className: "bg-blue-50/80 text-blue-900 border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-100 dark:border-blue-800/60"
  },
  {
    title: "Bingo tradicional",
    description: "R$ 8,00 ou 3 por R$ 20,00",
    icon: Ticket,
    className: "bg-violet-50/80 text-violet-900 border-violet-200/60 dark:bg-violet-950/60 dark:text-violet-100 dark:border-violet-800/60"
  },
  {
    title: "Bar e cozinha",
    description: "Serviço completo nos dois dias",
    icon: Utensils,
    className: "bg-orange-50/80 text-orange-900 border-orange-200/60 dark:bg-orange-950/60 dark:text-orange-100 dark:border-orange-800/60"
  },
  {
    title: "Famílias convidadas",
    description: "Fé, música e confraternização",
    icon: HeartHandshake,
    className: "bg-emerald-50/80 text-emerald-900 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-800/60"
  }
];

const Schedule = () => {
  const [selectedDay, setSelectedDay] = useState<EventDay>("saturday");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { weather } = useWeather();
  const { banners } = useAdvertisements({ position: "home" });
  const nextEvent = getNextEvent();
  const countdown = useCountdown(nextEvent?.date || new Date());
  const currentEvents = getEventsByDay(selectedDay);
  const selectedDayInfo = eventDays[selectedDay];
  const selectedTone = dayToneClasses[selectedDay];
  const totalEvents = eventDayOrder.reduce((total, day) => total + getEventsByDay(day).length, 0);
  const nextEventLabel = nextEvent
    ? `${eventDays[nextEvent.event.date === eventDays.saturday.isoDate ? "saturday" : "sunday"].shortDate} às ${nextEvent.event.time}`
    : scheduleSummary.dateRange;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleDaySwipe = (direction: "left" | "right") => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    if (direction === "right" && selectedDay === "saturday") {
      setSelectedDay("sunday");
    } else if (direction === "left" && selectedDay === "sunday") {
      setSelectedDay("saturday");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-lg pt-safe"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {nextEvent && (
          <div className="bg-gradient-to-r from-trucker-blue to-trucker-blue/80 text-trucker-blue-foreground px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="truncate text-sm font-medium">Próximo: {nextEvent.event.title}</span>
              </div>
              {countdown.isActive && !countdown.isPast && (
                <div className="shrink-0 rounded-full bg-white/20 px-2 py-1 text-xs font-medium">
                  {countdown.days > 0 ? `${countdown.days}d ` : ""}
                  {countdown.hours}h {countdown.minutes}m
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-trucker-blue">
                <CalendarIcon className="h-5 w-5 text-trucker-blue-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Programação</h1>
                <p className="text-xs text-muted-foreground">{scheduleSummary.dateRange}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-muted-foreground"
              aria-label="Atualizar programação"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="relative rounded-2xl bg-muted/50 p-1 backdrop-blur">
            <div className="relative flex">
              <motion.div
                className="absolute inset-y-1 rounded-xl bg-background shadow-md"
                animate={{
                  x: selectedDay === "saturday" ? 0 : "100%",
                  width: "50%"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              {eventDayOrder.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative z-10 flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    selectedDay === day ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {eventDays[day].tabLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.header>

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="min-h-screen px-4 pb-24 pt-44">
          <LiveRouteBanner />
          {banners.length > 0 && (
            <div className="py-2 bg-muted/20 -mx-4 px-4 mb-4">
              <BannerCarousel
                banners={banners}
                showControls={true}
                showDots={true}
                className="rounded-lg shadow-md"
                autoplayDelay={5000}
                compact={true}
              />
            </div>
          )}
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: selectedDay === "sunday" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              const swipeThreshold = 50;
              if (info.offset.x > swipeThreshold) handleDaySwipe("right");
              if (info.offset.x < -swipeThreshold) handleDaySwipe("left");
            }}
            className="mx-auto max-w-3xl space-y-6"
          >
            <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-background via-yellow-50/50 to-blue-50/60 p-5 shadow-xl dark:via-yellow-950/20 dark:to-blue-950/30">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Badge className="mb-3 bg-yellow-400 text-black hover:bg-yellow-400">
                    Programação oficial 2026
                  </Badge>
                  <h2 className="text-2xl font-black leading-tight text-foreground">
                    XXII Festa de São Cristóvão
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {scheduleSummary.dateRange} na Capela Santa Teresinha, bairro Universitário, em Tijucas.
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-trucker-blue text-trucker-blue-foreground shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                  <div className="text-xl font-black text-foreground">{totalEvents}</div>
                  <div className="text-[11px] font-medium leading-tight text-muted-foreground">momentos</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                  <div className="text-xl font-black text-foreground">2</div>
                  <div className="text-[11px] font-medium leading-tight text-muted-foreground">dias de festa</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                  <div className="text-xl font-black text-foreground">18h</div>
                  <div className="text-[11px] font-medium leading-tight text-muted-foreground">abertura</div>
                </div>
              </div>

              {nextEvent && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200/70 bg-blue-50/80 p-3 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-100">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
                      Próximo momento
                    </div>
                    <div className="font-bold leading-tight">{nextEvent.event.title}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">{nextEventLabel}</div>
                  </div>
                </div>
              )}
            </Card>

            <section className="grid gap-3 sm:grid-cols-2" aria-label="Resumo por dia">
              {eventDayOrder.map((day) => {
                const dayInfo = eventDays[day];
                const dayEvents = getEventsByDay(day);
                const tone = dayToneClasses[day];
                const firstEvent = dayEvents[0];
                const lastEvent = dayEvents[dayEvents.length - 1];
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-2xl border p-4 text-left shadow-sm transition-all active:scale-[0.99] ${tone.card} ${
                      isSelected ? "ring-2 ring-primary/30" : "hover:border-primary/40"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
                          <CalendarDays className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold uppercase text-muted-foreground">
                            {dayInfo.shortDate}
                          </div>
                          <div className="font-black leading-tight text-foreground">{dayInfo.title}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                    </div>

                    <div className="mb-2 text-sm font-bold leading-tight text-foreground">{dayInfo.focus}</div>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{dayInfo.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline" className={tone.badge}>
                        {dayEvents.length} eventos
                      </Badge>
                      <span className="font-medium text-muted-foreground">
                        {firstEvent?.time} - {lastEvent?.time}
                      </span>
                    </div>
                  </button>
                );
              })}
            </section>

            <Card className="overflow-hidden border-border/60 bg-background shadow-xl">
              <div className="border-b border-border/50 p-4">
                <Badge className="mb-2 bg-yellow-400 text-black hover:bg-yellow-400">
                  {scheduleSummary.edition}
                </Badge>
                <h2 className="text-2xl font-black leading-tight text-foreground">São Cristóvão 2026</h2>
                <p className="text-sm text-muted-foreground">{scheduleSummary.dateRange}</p>
              </div>
              <div className="relative aspect-[390/579] w-full overflow-hidden bg-zinc-950 sm:aspect-[16/10]">
                <img
                  src={posterImage}
                  alt="Cartaz oficial da XXII Festa de São Cristóvão 2026"
                  className="h-full w-full object-contain object-center"
                />
              </div>
            </Card>

            <Card className="border-border/60 p-5 shadow-md">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-trucker-blue text-trucker-blue-foreground">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {scheduleSummary.community}
                  </p>
                  <h2 className="text-xl font-bold leading-tight text-foreground">
                    Dois dias de fé, tradição e comunidade
                  </h2>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {scheduleSummary.invitation}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {scheduleInfoCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className={`rounded-xl border p-3 ${item.className}`}>
                      <Icon className="mb-2 h-5 w-5" />
                      <div className="text-sm font-bold leading-tight">{item.title}</div>
                      <div className="mt-1 text-xs leading-snug opacity-80">{item.description}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-yellow-300/60 bg-yellow-50/80 p-3 text-yellow-950 dark:border-yellow-800/60 dark:bg-yellow-950/30 dark:text-yellow-100">
                <Utensils className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium leading-relaxed">
                  {scheduleSummary.kitchenNotice} {scheduleSummary.bingoPrice}
                </p>
              </div>
            </Card>

            <section className="space-y-4">
              <div className={`rounded-xl border p-4 shadow-sm ${selectedTone.card}`}>
                <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selectedTone.icon}`}>
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedDayInfo.title}</h2>
                    <p className="text-sm text-muted-foreground">{selectedDayInfo.dateLabel}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selectedDayInfo.summary}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 ${selectedTone.badge}`}
                >
                  {currentEvents.length} eventos
                </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {currentEvents.map((event) => (
                  <div
                    key={`quick-${event.id}`}
                    className="rounded-xl border border-border/50 bg-background/80 p-3 text-left shadow-sm"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-black text-primary">{event.time}</span>
                      <DynamicIcon iconName={event.icon} className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                      {event.title}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative space-y-4">
                <motion.div
                  className={`absolute bottom-0 left-5 top-0 w-0.5 bg-gradient-to-b ${selectedTone.rail}`}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />

                {currentEvents.map((event, index) => {
                  const status = getEventStatus(event);
                  const typeConfig = getEventTypeConfig(event.type);

                  return (
                    <motion.article
                      key={event.id}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.08 }}
                      className="relative pl-12"
                    >
                      <div
                        className={`absolute left-2 top-5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background shadow-lg ${
                          status === "current" ? "bg-green-500" : status === "past" ? "bg-muted" : "bg-primary"
                        }`}
                      >
                        <DynamicIcon iconName={event.icon} className="h-3.5 w-3.5 text-white" />
                      </div>

                      <Card className={`overflow-hidden border ${typeConfig.border} bg-gradient-to-br ${typeConfig.gradient} shadow-sm`}>
                        <div className="p-4">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/70">
                                <DynamicIcon iconName={event.icon} className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <div className="text-2xl font-black text-foreground">{event.time}</div>
                                <Badge className={`${typeConfig.color} mt-1 text-xs`} variant="secondary">
                                  {typeConfig.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              {event.hasRoute && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15">
                                  <Car className="h-4 w-4 text-green-500" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="bg-background/70">
                              {statusLabels[status]}
                            </Badge>
                            {event.highlight && (
                              <Badge variant="outline" className="bg-background/70">
                                {event.highlight}
                              </Badge>
                            )}
                            {event.price && (
                              <Badge className="bg-yellow-400 text-black hover:bg-yellow-400">
                                {event.price}
                              </Badge>
                            )}
                          </div>

                          <h3 className="mb-2 text-xl font-bold leading-tight text-foreground">
                            {event.title}
                          </h3>
                          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                            {event.description}
                          </p>

                          {event.details && event.details.length > 0 && (
                            <div className="mb-4 grid gap-2">
                              {event.details.map((detail) => (
                                <div key={detail} className="flex items-center gap-2 rounded-lg bg-background/55 px-3 py-2 text-sm">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  <span>{detail}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </Card>
                    </motion.article>
                  );
                })}
              </div>
            </section>


            <section className="space-y-4">
              {weather?.event && weather.event.length > 0 ? (
                <WeatherEventCard eventWeather={weather.event} selectedDay={selectedDay} />
              ) : (
                <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-blue-50/40 p-4 backdrop-blur-sm dark:border-blue-800/50 dark:from-blue-950/80 dark:via-blue-900/60 dark:to-blue-950/40">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                      <Thermometer className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-blue-900 dark:text-blue-100">
                        Previsão do tempo
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Carregando previsão para o evento...
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="border-green-200/50 bg-gradient-to-br from-green-50/80 via-green-100/60 to-green-50/40 p-4 backdrop-blur-sm dark:border-green-800/50 dark:from-green-950/80 dark:via-green-900/60 dark:to-green-950/40">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 font-semibold text-green-900 dark:text-green-100">
                      Capela Santa Teresinha
                    </h3>
                    <p className="mb-2 text-sm text-green-700 dark:text-green-300">
                      Bairro Universitário, Tijucas/SC
                    </p>
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <Users className="h-3 w-3" />
                      <span>Comunidade, famílias e visitantes convidados</span>
                    </div>
                  </div>
                  <NavigationActions
                    coordinates={{
                      latitude: -27.24173,
                      longitude: -48.646721
                    }}
                    address="Capela Santa Teresinha, bairro Universitário, Tijucas - SC"
                    title="Como chegar na Capela Santa Teresinha"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300/50 text-green-700 hover:bg-green-100/50"
                    >
                      Ver mapa
                    </Button>
                  </NavigationActions>
                </div>
              </Card>
            </section>
          </motion.div>
        </main>
      </PullToRefresh>

      <BottomNavigation />
    </div>
  );
};

export default Schedule;
