import { useState } from "react";
import { motion } from "framer-motion";
import { Cloud, CloudRain, Sun, Moon, Wind, Droplets, Eye, CloudSnow, Thermometer, Calendar } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import { WeatherEventCard } from "@/components/weather/WeatherEventCard";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const getWeatherIcon = (condition: string) => {
  if (condition.includes('rain')) return CloudRain;
  if (condition.includes('cloud')) return Cloud;
  if (condition.includes('clear') && condition.includes('day')) return Sun;
  if (condition.includes('clear') && condition.includes('night')) return Moon;
  if (condition.includes('snow')) return CloudSnow;
  return Sun;
};

const WeatherSkeleton = () => (
  <div className="bg-card rounded-2xl shadow-lg p-6 w-full">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-6 w-20" />
    </div>
    <div className="flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <Skeleton className="h-10 w-full mt-4" />
  </div>
);

export function WeatherSection() {
  const { weather, isLoading, error } = useWeather();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <WeatherSkeleton />;
  }

  if (error || !weather) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 w-full"
      >
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <div className="text-center">
            <Cloud className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar a previsão do tempo
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const { now, forecast, event } = weather;
  const WeatherIcon = getWeatherIcon(now.condition);
  const currentDate = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 w-full"
    >
      {/* Current Weather Card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card rounded-2xl shadow-lg p-6 w-full"
      >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          🌤️ Previsão do Tempo
        </h2>
        <span className="text-sm text-muted-foreground capitalize">
          {currentDate}
        </span>
      </div>

      {/* Current Weather */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4 mb-4"
      >
        {/* Weather Icon */}
        <div className="relative">
          {now.condition_icon ? (
            <img 
              src={now.condition_icon} 
              alt={now.description} 
              className="w-16 h-16"
            />
          ) : (
            <WeatherIcon className="w-16 h-16 text-primary" />
          )}
        </div>

        {/* Temperature and Description */}
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {now.temp}°
            </span>
            <span className="text-lg text-muted-foreground">C</span>
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {now.description}
          </p>
          
          {/* Weather Details */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              <span>{now.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span>{now.wind_kmh} km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{now.cloudiness}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA Button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full mt-2"
          >
            Ver previsão completa
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🌤️ Previsão para os próximos dias
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {forecast.slice(0, 5).map((day, index) => {
              const DayIcon = getWeatherIcon(day.condition);
              
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-border rounded-lg p-3 bg-card"
                >
                  <div className="flex items-center gap-3">
                    {/* Day Icon */}
                    {day.condition_icon ? (
                      <img 
                        src={day.condition_icon} 
                        alt={day.description} 
                        className="w-10 h-10"
                      />
                    ) : (
                      <DayIcon className="w-10 h-10 text-primary" />
                    )}

                    {/* Day Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">
                          {day.weekday}
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {day.min}° / {day.max}°
                        </p>
                      </div>
                      
                      <p className="text-sm text-muted-foreground capitalize">
                        {day.description}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          {day.humidity}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Wind className="w-3 h-3" />
                          {day.wind_kmh} km/h
                        </span>
                        {day.rain_probability > 0 && (
                          <span className="flex items-center gap-1">
                            <CloudRain className="w-3 h-3" />
                            {day.rain_probability}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </motion.section>

    {/* Event Weather Section */}
    {event && event.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/90 to-primary rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                🎉 Previsão para a Festa
              </h3>
              <p className="text-sm text-muted-foreground">
                Sábado 19 e Domingo 20 de Julho
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.map((day, index) => {
              const DayIcon = getWeatherIcon(day.condition);
              
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative overflow-hidden border border-border rounded-xl p-4 bg-gradient-to-br from-background/50 to-muted/20 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {day.condition_icon ? (
                        <img 
                          src={day.condition_icon} 
                          alt={day.description} 
                          className="w-8 h-8"
                        />
                      ) : (
                        <DayIcon className="w-8 h-8 text-primary" />
                      )}
                      <div>
                        <p className="font-bold text-foreground">{day.weekday}</p>
                        <p className="text-xs text-muted-foreground">{day.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        {day.min}° - {day.max}°
                      </p>
                      <Badge 
                        variant="secondary"
                        className="text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {day.description}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3 h-3" />
                      <span>{day.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3" />
                      <span>{day.wind_kmh} km/h</span>
                    </div>
                    {day.rain_probability > 0 && (
                      <div className="flex items-center gap-1">
                        <CloudRain className="w-3 h-3" />
                        <span>{day.rain_probability}%</span>
                      </div>
                    )}
                  </div>

                  {/* Gradient overlay for visual appeal */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-2xl" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    )}
  </motion.div>
  );
}