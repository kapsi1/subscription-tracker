'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, formatCurrency } from '@/lib/utils';
import type { MonthlyPayment } from './MonthlyPayments';

interface MonthlyPaymentsCalendarProps {
  monthlyPayments: MonthlyPayment[];
  selectedDate: Date;
  onSelectDay: (date: Date, payments: MonthlyPayment[]) => void;
}

function getLocalDateKey(dateValue: Date | string) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getFirstDayOfWeek(locale: string) {
  try {
    const weekInfo = (
      new Intl.Locale(locale) as Intl.Locale & {
        weekInfo?: { firstDay: number };
      }
    ).weekInfo;
    if (weekInfo) {
      return weekInfo.firstDay % 7;
    }
  } catch {
    // Fallback below
  }

  return locale.startsWith('en') ? 0 : 1;
}

export function MonthlyPaymentsCalendar({
  monthlyPayments,
  selectedDate,
  onSelectDay,
}: MonthlyPaymentsCalendarProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';

  const paymentsByDay = useMemo(() => {
    return monthlyPayments.reduce<Record<string, MonthlyPayment[]>>((accumulator, payment) => {
      const dayKey = getLocalDateKey(payment.date);
      accumulator[dayKey] ??= [];
      accumulator[dayKey].push(payment);
      return accumulator;
    }, {});
  }, [monthlyPayments]);

  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(locale), [locale]);

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const baseSunday = new Date(Date.UTC(2024, 0, 7));

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(baseSunday);
      date.setUTCDate(baseSunday.getUTCDate() + ((firstDayOfWeek + index) % 7));
      return formatter.format(date);
    });
  }, [firstDayOfWeek, locale]);

  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (firstOfMonth.getDay() - firstDayOfWeek + 7) % 7;
    const todayKey = getLocalDateKey(new Date());

    return [
      ...Array.from({ length: offset }, (_, i) => ({
        gridKey: `empty-${i}`,
        isEmpty: true as const,
      })),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(year, month, index + 1);
        const dayKey = getLocalDateKey(date);

        return {
          date,
          dayKey,
          dayNumber: index + 1,
          isToday: dayKey === todayKey,
          payments: paymentsByDay[dayKey] ?? [],
        };
      }),
    ];
  }, [firstDayOfWeek, paymentsByDay, selectedDate]);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [locale],
  );

  return (
    <Card className="min-w-0 overflow-hidden shadow-sm">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0">
            <CardTitle>{t('dashboard.paymentCalendarTitle')}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6">
        <div className="mx-auto w-full space-y-2 sm:w-fit">
          <div className="grid grid-cols-7 justify-items-stretch gap-1.5 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/60 sm:gap-2 sm:text-xs">
            {weekdayLabels.map((label) => (
              <div key={label} className="w-full py-1 sm:w-[60px]">
                {label}
              </div>
            ))}
          </div>

          <TooltipProvider delayDuration={150}>
            <div className="grid grid-cols-7 justify-items-stretch gap-1.5 py-1 sm:gap-2">
              {calendarDays.map((day) => {
                if ('isEmpty' in day) {
                  return (
                    <div
                      key={day.gridKey}
                      className="h-auto w-full aspect-square sm:h-[60px] sm:w-[60px]"
                    />
                  );
                }

                const formattedDate = formatter.format(day.date);
                const paymentCountLabel =
                  day.payments.length > 0
                    ? t('subscriptions.paymentCount', { count: day.payments.length })
                    : '';

                const button = (
                  <Button
                    type="button"
                    variant="outline"
                    data-testid={`payment-calendar-day-${day.dayKey}`}
                    aria-label={`${t('dashboard.paymentCalendarOpenDay', { date: formattedDate })}${paymentCountLabel ? `, ${paymentCountLabel}` : ''}`}
                    onClick={() => onSelectDay(day.date, day.payments)}
                    className={cn(
                      'relative h-auto w-full aspect-square p-0 text-base sm:h-[60px] sm:w-[60px] sm:text-lg',
                      'hover:-translate-y-0.5 transition-all duration-200',
                      'border-foreground/15 bg-card shadow-xs',
                      day.isToday && 'border-primary/50 bg-primary/10 ring-1 ring-primary/20',
                    )}
                  >
                    <span className="font-bold text-foreground">{day.dayNumber}</span>

                    {day.payments.length > 0 ? (
                      <Badge className="absolute -top-2 -right-2 min-w-6 h-6 justify-center rounded-full bg-red-500 px-1 text-[13px] font-bold text-white hover:bg-red-500">
                        {day.payments.length}
                      </Badge>
                    ) : null}
                  </Button>
                );

                if (day.payments.length === 0) {
                  return (
                    <div key={day.dayKey} className="w-full">
                      {button}
                    </div>
                  );
                }

                return (
                  <Tooltip key={day.dayKey}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] space-y-2 p-3">
                      <p className="font-medium">{formattedDate}</p>
                      <ul className="space-y-1.5">
                        {day.payments.map((payment) => (
                          <li
                            key={payment.id}
                            className="flex items-center justify-between gap-3 text-[14px]"
                          >
                            <span className="truncate text-muted-foreground">{payment.name}</span>
                            <span className="shrink-0 font-medium text-foreground">
                              {formatCurrency(payment.amount, payment.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
