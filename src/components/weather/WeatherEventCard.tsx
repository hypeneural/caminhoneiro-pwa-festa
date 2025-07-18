import { useState } from "react";
import { motion } from "framer-motion";
import { Cloud, CloudRain, Sun, Moon, Wind, Droplets, Eye, CloudSnow, Thermometer, Calendar, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeatherEvent } from "@/types/weather";

const getWeatherIcon = (condition: string) => {
  if (condition.includes('rain')) return CloudRain;
  if (condition.includes('cloud')) return Cloud;
  if (condition.includes('clear') && condition.includes('day')) return Sun;
  if (condition.includes('clear') && condition.includes('night')) return Moon;
  if (condition.includes('snow')) return CloudSnow;
  return Sun;
};

const getConditionColor = (condition: string) => {
  if (condition.includes('rain')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
  if (condition.includes('cloud')) return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  if (condition.includes('clear')) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
  return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
};

interface WeatherEventCardProps {
  eventWeather: WeatherEvent[];
  selectedDay?: 'saturday' | 'sunday';
  compact?: boolean;
}

export function WeatherEventCard({ eventWeather, selectedDay, compact = false }: WeatherEventCardProps) {
  const [open, setOpen] = useState(false);

  if (!eventWeather || eventWeather.length === 0) {
    return (
      <Card className="p-4 bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-blue-50/40 dark:from-blue-950/80 dark:via-blue-900/60 dark:to-blue-950/40 border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Cloud className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Carregando previsão do tempo...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Filtra por dia específico se fornecido
  const weatherData = selectedDay
    ? eventWeather.filter(day => 
        (selectedDay === 'saturday' && day.weekday === 'Sáb') ||
        (selectedDay === 'sunday' && day.weekday === 'Dom')
      )
    : eventWeather;

  const currentDayWeather = weatherData[0];

  if (!currentDayWeather) {
    return null;
  }

  const WeatherIcon = getWeatherIcon(currentDayWeather.condition);
  const conditionColor = getConditionColor(currentDayWeather.condition);

  if (compact) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <Card className="p-3 bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-blue-50/40 dark:from-blue-950/80 dark:via-blue-900/60 dark:to-blue-950/40 border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm"
                  whileHover={{ rotate: 5 }}
                >
                  {currentDayWeather.condition_icon ? (
                    <img 
                      src={currentDayWeather.condition_icon} 
                      alt={currentDayWeather.description} 
                      className="w-5 h-5"
                    />
                  ) : (
                    <WeatherIcon className="w-4 h-4 text-white" />
                  )}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 truncate">
                    {currentDayWeather.weekday} • {currentDayWeather.min}°-{currentDayWeather.max}°C
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                    {currentDayWeather.description}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🌤️ Previsão para o evento
            </DialogTitle>
          </DialogHeader>
          <WeatherDetailContent eventWeather={eventWeather} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-pointer"
        >
          <Card className="p-4 bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-blue-50/40 dark:from-blue-950/80 dark:via-blue-900/60 dark:to-blue-950/40 border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 10 }}
              >
                {currentDayWeather.condition_icon ? (
                  <img 
                    src={currentDayWeather.condition_icon} 
                    alt={currentDayWeather.description} 
                    className="w-7 h-7"
                  />
                ) : (
                  <WeatherIcon className="w-6 h-6 text-white" />
                )}
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    {currentDayWeather.weekday} • Previsão do Tempo
                  </h3>
                  <Badge className={`${conditionColor} text-xs px-2 py-0.5`}>
                    {currentDayWeather.description}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-4 h-4" />
                    <span className="font-medium">{currentDayWeather.min}° - {currentDayWeather.max}°C</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplets className="w-4 h-4" />
                    <span>{currentDayWeather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="w-4 h-4" />
                    <span>{currentDayWeather.wind_kmh} km/h</span>
                  </div>
                </div>
                {currentDayWeather.rain_probability > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400">
                    <CloudRain className="w-3 h-3" />
                    <span>{currentDayWeather.rain_probability}% chance de chuva</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🌤️ Previsão detalhada para o evento
          </DialogTitle>
        </DialogHeader>
        <WeatherDetailContent eventWeather={eventWeather} />
      </DialogContent>
    </Dialog>
  );
}

function WeatherDetailContent({ eventWeather }: { eventWeather: WeatherEvent[] }) {
  return (
    <div className="space-y-4 mt-4">
      {eventWeather.map((day, index) => {
        const WeatherIcon = getWeatherIcon(day.condition);
        const conditionColor = getConditionColor(day.condition);
        
        return (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-border rounded-lg p-4 bg-card space-y-3"
          >
            {/* Header do dia */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {day.condition_icon ? (
                  <img 
                    src={day.condition_icon} 
                    alt={day.description} 
                    className="w-10 h-10"
                  />
                ) : (
                  <WeatherIcon className="w-10 h-10 text-primary" />
                )}
                <div>
                  <p className="font-bold text-lg">{day.weekday}</p>
                  <p className="text-sm text-muted-foreground">{day.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{day.min}° - {day.max}°</p>
                <Badge className={`${conditionColor} text-xs`}>
                  {day.description}
                </Badge>
              </div>
            </div>

            {/* Detalhes meteorológicos */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Droplets className="w-4 h-4" />
                    Umidade
                  </span>
                  <span className="font-medium">{day.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Wind className="w-4 h-4" />
                    Vento
                  </span>
                  <span className="font-medium">{day.wind_kmh} km/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    Nuvens
                  </span>
                  <span className="font-medium">{day.cloudiness}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CloudRain className="w-4 h-4" />
                    Chuva
                  </span>
                  <span className="font-medium">{day.rain_probability}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Sun className="w-4 h-4" />
                    Nascer
                  </span>
                  <span className="font-medium">{day.sunrise}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Moon className="w-4 h-4" />
                    Pôr
                  </span>
                  <span className="font-medium">{day.sunset}</span>
                </div>
              </div>
            </div>

            {/* Recomendações baseadas no clima */}
            {day.rain_probability > 50 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <CloudRain className="w-4 h-4" />
                  Alta probabilidade de chuva. Recomendamos levar guarda-chuva!
                </p>
              </div>
            )}
            
            {day.max > 30 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Dia quente! Lembre-se de se hidratar e usar protetor solar.
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
} 