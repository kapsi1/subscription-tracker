import type { Category, Subscription } from '@subtracker/shared';
import {
  ArrowUpDown,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Tag,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicIcon } from '@/components/DynamicIcon';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { buildGoogleCalendarUrl } from '@/lib/google-calendar';
import {
  findCategoryColor,
  findCategoryIcon,
  formatCurrency,
  formatDate,
  getCategoryStyle,
} from '@/lib/utils';

interface SubscriptionsTableProps {
  filteredSubscriptions: Subscription[];
  categories: Category[];
  searchQuery: string;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function SubscriptionsTable({
  filteredSubscriptions,
  categories,
  searchQuery,
  onEdit,
  onDelete,
  onAdd,
}: SubscriptionsTableProps) {
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Subscription;
    direction: 'asc' | 'desc';
  }>({ key: 'nextBillingDate' as keyof Subscription, direction: 'asc' });

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    const key = sortConfig.key;
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    const aValue = a[key];
    const bValue = b[key];

    // Numeric comparison for amount
    if (key === 'amount') {
      const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue as string) || 0;
      const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue as string) || 0;
      return (aNum - bNum) * direction;
    }

    // Handle null/undefined values
    if (aValue === bValue) return 0;
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    // String comparison for names and categories
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * direction;
    }

    // Generic comparison for other types
    return (aValue < bValue ? -1 : 1) * direction;
  });

  const handleSort = (key: keyof Subscription) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Subscription) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  if (filteredSubscriptions.length === 0) {
    return (
      <EmptyState
        title={t('subscriptions.noFound')}
        description={searchQuery ? t('subscriptions.noFoundDesc') : t('subscriptions.getStarted')}
        actionLabel={searchQuery ? undefined : t('subscriptions.add')}
        onAction={searchQuery ? undefined : onAdd}
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
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                {t('subscriptions.table.service')}
                {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors select-none"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center">
                {t('subscriptions.table.amount')}
                {getSortIcon('amount')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors select-none"
              onClick={() => handleSort('billingCycle')}
            >
              <div className="flex items-center">
                {t('subscriptions.table.cycle')}
                {getSortIcon('billingCycle')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors select-none"
              onClick={() => handleSort('nextBillingDate')}
            >
              <div className="flex items-center">
                {t('subscriptions.table.next')}
                {getSortIcon('nextBillingDate')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors select-none"
              onClick={() => handleSort('category')}
            >
              <div className="flex items-center">
                {t('subscriptions.table.category')}
                {getSortIcon('category')}
              </div>
            </TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSubscriptions.map((subscription) =>
            (() => {
              const googleCalendarUrl = buildGoogleCalendarUrl(subscription);

              return (
                <TableRow
                  key={subscription.id}
                  className="animate-row-in hover:bg-accent/50 cursor-pointer group"
                  onClick={() => onEdit(subscription)}
                >
                  <TableCell className="font-medium max-w-[200px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate cursor-pointer">{subscription.name}</div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[300px] wrap-break-word">
                          {subscription.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(subscription.amount, subscription.currency)}
                  </TableCell>
                  <TableCell>
                    {t(`subscriptions.modal.billingCycles.${subscription.billingCycle}`)}
                  </TableCell>
                  <TableCell>
                    {subscription.nextBillingDate
                      ? formatDate(subscription.nextBillingDate)
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="gap-1.5"
                      style={getCategoryStyle(
                        findCategoryColor(categories, subscription.category),
                        'dashboard',
                      )}
                    >
                      <DynamicIcon
                        name={findCategoryIcon(categories, subscription.category)}
                        fallback={Tag}
                        className="w-3.5 h-3.5"
                      />
                      {t(`subscriptions.modal.categories.${subscription.category}`, {
                        defaultValue: subscription.category,
                      })}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
                      {googleCalendarUrl ? (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                          <a
                            href={googleCalendarUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={t('subscriptions.exportToGoogleCalendar', {
                              subscriptionName: subscription.name,
                            })}
                            title={t('subscriptions.openInGoogleCalendar')}
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(subscription);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(subscription.id);
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })(),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
