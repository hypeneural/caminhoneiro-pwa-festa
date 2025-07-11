import { useState, useEffect } from 'react';

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isActive: boolean;
  isPast: boolean;
}

export const useCountdown = (targetDate: Date): CountdownTime => {
  const [time, setTime] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isActive: false,
    isPast: false
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference < 0) {
        setTime(prev => {
          if (!prev.isPast) {
            return {
              days: 0,
              hours: 0,
              minutes: 0,
              seconds: 0,
              isActive: false,
              isPast: true
            };
          }
          return prev;
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTime(prev => {
        // Only update if values actually changed
        if (prev.days !== days || prev.hours !== hours || prev.minutes !== minutes || prev.seconds !== seconds) {
          return {
            days,
            hours,
            minutes,
            seconds,
            isActive: true,
            isPast: false
          };
        }
        return prev;
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate.getTime()]); // Use getTime() for stable dependency

  return time;
};