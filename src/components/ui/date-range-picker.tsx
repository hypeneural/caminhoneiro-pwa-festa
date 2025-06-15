import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value: {
    start?: Date;
    end?: Date;
  };
  onChange: (range: { start?: Date; end?: Date }) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      onChange({
        start: range.from,
        end: range.to
      });
    } else {
      onChange({});
    }
  };

  const displayText = () => {
    if (value.start && value.end) {
      return `${format(value.start, 'dd/MM/yyyy')} - ${format(value.end, 'dd/MM/yyyy')}`;
    } else if (value.start) {
      return `${format(value.start, 'dd/MM/yyyy')} - ...`;
    } else if (value.end) {
      return `... - ${format(value.end, 'dd/MM/yyyy')}`;
    }
    return 'Selecione um período';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value.start && !value.end && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{
            from: value.start,
            to: value.end
          }}
          onSelect={handleSelect}
          numberOfMonths={1}
          defaultMonth={value.start || new Date()}
        />
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onChange({});
                setIsOpen(false);
              }}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}