import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface CountdownBadgeProps {
  targetDate: Date;
  eventName: string;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({ targetDate, eventName }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetTime = targetDate.getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
        setIsLive(false);
      } else {
        // Check if event is happening now (within 2 hours)
        const eventEndTime = targetTime + (2 * 60 * 60 * 1000); // 2 hours after start
        setIsLive(now <= eventEndTime);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isLive) {
    return (
      <Badge className="bg-trucker-red text-trucker-red-foreground animate-pulse flex items-center gap-1">
        <div className="w-2 h-2 bg-white rounded-full" />
        AO VIVO
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-trucker-blue/10 text-trucker-blue border-trucker-blue flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {timeLeft.days > 0 ? `${timeLeft.days}d ${timeLeft.hours}h` : 
       timeLeft.hours > 0 ? `${timeLeft.hours}h ${timeLeft.minutes}m` :
       `${timeLeft.minutes}m ${timeLeft.seconds}s`}
    </Badge>
  );
};