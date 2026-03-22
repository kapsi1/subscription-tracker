'use client';

import type { PaymentHistory } from '@subtracker/shared';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingState } from '@/components/loading-state';
import { PaymentDetailsModal } from '@/components/payment-details-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { PaymentsHistoryTable } from '../_components/PaymentsHistoryTable';

export default function ManageHistoryPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingPayment, setViewingPayment] = useState<PaymentHistory | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const { data: allPayments = [], isLoading } = useQuery<PaymentHistory[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await api.get('/payments');
      return res.data;
    },
  });

  const filteredPayments = allPayments.filter((p) =>
    p.subscriptionName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('subscriptions.history.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{t('subscriptions.history.title')}</CardTitle>
          <CardDescription>
            {t('subscriptions.history.foundCount', { count: filteredPayments.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsHistoryTable
            payments={filteredPayments}
            searchQuery={searchQuery}
            onRowClick={(p) => {
              setViewingPayment(p);
              setPaymentModalOpen(true);
            }}
          />
        </CardContent>
      </Card>
      <PaymentDetailsModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        payment={viewingPayment}
      />
    </>
  );
}
