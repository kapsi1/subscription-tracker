'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, formatCurrency } from '@/lib/utils';
import type { MonthlyPayment } from './MonthlyPayments';

interface DayPaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  payments: MonthlyPayment[];
  onPaymentSelect: (payment: MonthlyPayment) => void;
}

type SortKey = 'name' | 'amount';
type SortDirection = 'asc' | 'desc';

export function DayPaymentsModal({
  open,
  onOpenChange,
  selectedDate,
  payments,
  onPaymentSelect,
}: DayPaymentsModalProps) {
  const { t, i18n } = useTranslation();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'name',
    direction: 'asc',
  });

  const formattedDate = useMemo(() => {
    if (!selectedDate) {
      return '';
    }

    return new Intl.DateTimeFormat(i18n.language || 'en', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(selectedDate);
  }, [i18n.language, selectedDate]);

  const sortedPayments = useMemo(() => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    return [...payments].sort((left, right) => {
      if (sortConfig.key === 'amount') {
        const amountDiff = (Number(left.amount) - Number(right.amount)) * direction;
        if (amountDiff !== 0) {
          return amountDiff;
        }
      } else {
        const nameDiff = left.name.localeCompare(right.name) * direction;
        if (nameDiff !== 0) {
          return nameDiff;
        }
      }

      return new Date(left.date).getTime() - new Date(right.date).getTime();
    });
  }, [payments, sortConfig]);

  const toggleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key ? (current.direction === 'asc' ? 'desc' : 'asc') : 'asc',
    }));
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return null;
    }

    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>
            {t('dashboard.paymentCalendarModalTitle', { date: formattedDate })}
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.paymentCalendarModalDesc', { count: payments.length })}
          </DialogDescription>
        </DialogHeader>

        {payments.length === 0 ? (
          <EmptyState
            title={t('subscriptions.history.noPayments')}
            description={t('dashboard.paymentCalendarEmptyDesc', { date: formattedDate })}
          />
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none transition-colors hover:text-foreground"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center">
                      {t('subscriptions.history.table.service')}
                      {renderSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right transition-colors hover:text-foreground"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center justify-end">
                      {t('subscriptions.history.table.amount')}
                      {renderSortIcon('amount')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => onPaymentSelect(payment)}
                  >
                    <TableCell className="max-w-[300px]">
                      <div className="min-w-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate font-medium">{payment.name}</div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[300px] wrap-break-word">
                              {payment.name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="mt-1">
                          <Badge
                            variant={payment.status === 'done' ? 'secondary' : 'outline'}
                            className={cn(
                              'text-[11px]',
                              payment.status !== 'done' && 'border-primary/25 bg-primary/5',
                            )}
                          >
                            {t(
                              payment.status === 'done'
                                ? 'dashboard.paymentDone'
                                : 'dashboard.paymentUpcoming',
                            )}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
