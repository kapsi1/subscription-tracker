import type { PaymentHistory } from '@subtracker/shared';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentsHistoryTableProps {
  payments: PaymentHistory[];
  searchQuery: string;
}

type SortKey = 'paidAt' | 'subscriptionName' | 'amount';

export function PaymentsHistoryTable({ payments, searchQuery }: PaymentsHistoryTableProps) {
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'paidAt',
    direction: 'desc',
  });

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const sorted = [...payments].sort((a, b) => {
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    if (sortConfig.key === 'amount') {
      return (Number(a.amount) - Number(b.amount)) * dir;
    }
    if (sortConfig.key === 'paidAt') {
      return (new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()) * dir;
    }
    return a.subscriptionName.localeCompare(b.subscriptionName) * dir;
  });

  if (payments.length === 0) {
    return (
      <EmptyState
        title={t('subscriptions.history.noPayments')}
        description={
          searchQuery ? t('subscriptions.noFoundDesc') : t('subscriptions.history.noPaymentsDesc')
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors select-none"
              onClick={() => handleSort('paidAt')}
            >
              <div className="flex items-center">
                {t('subscriptions.history.table.date')}
                {getSortIcon('paidAt')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors select-none"
              onClick={() => handleSort('subscriptionName')}
            >
              <div className="flex items-center">
                {t('subscriptions.history.table.service')}
                {getSortIcon('subscriptionName')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors select-none"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center">
                {t('subscriptions.history.table.amount')}
                {getSortIcon('amount')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((payment) => (
            <TableRow key={payment.id} className="animate-row-in">
              <TableCell>{formatDate(payment.paidAt)}</TableCell>
              <TableCell className="font-medium max-w-[200px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="truncate">{payment.subscriptionName}</div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[300px] wrap-break-word">
                      {payment.subscriptionName}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
