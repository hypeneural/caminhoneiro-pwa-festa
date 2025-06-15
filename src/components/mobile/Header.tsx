import { Truck, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border/50 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
          <Truck className="w-5 h-5 text-trucker-blue-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground">Festa do Caminhoneiro</h1>
      </div>
      
      <div className="relative">
        <button className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 transition-colors flex items-center justify-center">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs font-bold bg-trucker-red"
        >
          3
        </Badge>
      </div>
    </header>
  );
}