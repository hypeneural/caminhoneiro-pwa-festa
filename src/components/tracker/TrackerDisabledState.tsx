import { Link } from "react-router-dom";
import { CalendarDays, Clock, ExternalLink, MapPin, Navigation, Route, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const chapelMapsUrl = "https://www.google.com/maps/search/?api=1&query=Capela%20Santa%20Teresinha%20Bairro%20Universitario%20Tijucas%20SC";

const moments = [
  { time: "07:30", title: "Cafe da manha", icon: Utensils },
  { time: "09:00", title: "Procissao automotiva", icon: Navigation },
  { time: "12:00", title: "Almoco festivo", icon: Utensils },
];

export const TrackerDisabledState = () => {
  return (
    <div className="px-4 py-5">
      <div className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-4 text-white">
          <Badge className="mb-3 border-white/20 bg-white/12 text-white hover:bg-white/12">
            Domingo 19/07/2026
          </Badge>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/12">
              <Route className="h-5 w-5 text-yellow-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight">Rota da procissao</h2>
              <p className="mt-1 text-sm leading-snug text-white/75">
                O rastreamento ao vivo sera ativado quando a organizacao liberar o sinal da procissao.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-lg border border-border/70 bg-background p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-blue-600" />
              Capela Santa Teresinha
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Bairro Universitario, Tijucas/SC</p>
          </div>

          <div className="grid gap-2">
            {moments.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.time} className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                    <Icon className="h-4 w-4 text-trucker-blue" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {item.time}
                    </div>
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button asChild className="h-11 rounded-lg">
              <a href={chapelMapsUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir no Google Maps
              </a>
            </Button>

            <Button asChild variant="outline" className="h-11 rounded-lg">
              <Link to="/programacao">
                <CalendarDays className="mr-2 h-4 w-4" />
                Ver programacao
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
