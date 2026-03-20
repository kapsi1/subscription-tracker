'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';

interface MonthPickerProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export function MonthPicker({ selectedDate, setSelectedDate }: MonthPickerProps) {
  const { t } = useTranslation();
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const handleResetMonth = () => {
    const now = new Date();
    setSelectedDate(now);
    setPickerYear(now.getFullYear());
  };

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedDate(new Date(pickerYear, monthIndex, 1));
    setIsPickerOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-1 rounded-lg border bg-muted/50 px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-9 w-9 shrink-0"
          aria-label={t('common.previous')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <DropdownMenu
          open={isPickerOpen}
          onOpenChange={(open) => {
            setIsPickerOpen(open);
            if (open) setPickerYear(selectedDate.getFullYear());
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 min-w-0 flex-1 font-medium hover:bg-accent/50 focus-visible:ring-0 lg:min-w-[140px] lg:flex-none"
            >
              {formatDate(selectedDate.toISOString(), {
                month: 'long',
                year: 'numeric',
              })}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="p-3 w-64">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPickerYear((prev) => prev - 1);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-semibold text-sm">{pickerYear}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPickerYear((prev) => prev + 1);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((month, index) => {
                const isSelected =
                  selectedDate.getMonth() === index && selectedDate.getFullYear() === pickerYear;
                return (
                  <Button
                    key={month}
                    variant={isSelected ? 'default' : 'ghost'}
                    className="h-9 w-full text-xs font-medium"
                    onClick={() => handleMonthSelect(index)}
                  >
                    {formatDate(new Date(2000, index).toISOString(), { month: 'short' })}
                  </Button>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-9 w-9 shrink-0"
          aria-label={t('common.next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="outline" onClick={handleResetMonth} className="shrink-0">
        {t('dashboard.thisMonth')}
      </Button>
    </>
  );
}
