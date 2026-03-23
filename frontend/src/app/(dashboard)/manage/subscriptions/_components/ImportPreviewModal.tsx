'use client';

import { CheckCircle2, CreditCard, FileJson, History, LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ImportPreviewData {
  subscriptions?: Array<{ name: string; amount: number; currency: string }>;
  categories?: Array<{ name: string; color: string }>;
  payments?: Array<{ subscriptionName: string; amount: number; currency: string; paidAt: string }>;
}

interface ImportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ImportPreviewData | null;
  onConfirm: (replace: boolean) => void;
  isLoading: boolean;
}

export function ImportPreviewModal({
  open,
  onOpenChange,
  data,
  onConfirm,
  isLoading,
}: ImportPreviewModalProps) {
  const { t } = useTranslation();
  const [replaceExisting, setReplaceExisting] = useState(false);

  if (!data) return null;

  const subCount = data.subscriptions?.length || 0;
  const catCount = data.categories?.length || 0;
  const payCount = data.payments?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            {t('subscriptions.importPreview.title')}
          </DialogTitle>
          <DialogDescription>{t('subscriptions.importPreview.desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-accent/30 gap-1.5">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-xl font-bold">{subCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t('subscriptions.importPreview.subscriptions')}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-accent/30 gap-1.5">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              <span className="text-xl font-bold">{catCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t('subscriptions.importPreview.categories')}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-accent/30 gap-1.5">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-xl font-bold">{payCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t('subscriptions.importPreview.payments')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/50">
              <div className="space-y-1">
                <Label
                  htmlFor="replace-data"
                  className="text-sm font-semibold text-orange-800 dark:text-orange-300 leading-none cursor-pointer"
                >
                  {t('subscriptions.importPreview.replace')}
                </Label>
                <p className="text-xs text-orange-700/80 dark:text-orange-400/70">
                  {t('subscriptions.importPreview.replaceDesc')}
                </p>
              </div>
              <Switch
                id="replace-data"
                checked={replaceExisting}
                onCheckedChange={(checked: boolean) => setReplaceExisting(checked)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {t('subscriptions.importPreview.itemsToImport')}
            </h4>

            <div className="max-h-[300px] w-full rounded-md border p-4 overflow-y-auto space-y-6 bg-accent/10">
              {/* Subscriptions Section */}
              {subCount > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <CreditCard className="w-3 h-3" />
                    {t('subscriptions.importPreview.subscriptions')}
                  </h5>
                  <div className="space-y-1">
                    {data.subscriptions?.map((s) => (
                      <div
                        key={`${s.name}-${Math.random().toString(36).substring(2, 9)}`}
                        className="text-xs flex justify-between items-center py-1.5 border-b last:border-0 border-accent/50"
                      >
                        <span className="truncate font-medium">{s.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {s.amount} {s.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Section */}
              {catCount > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3" />
                    {t('subscriptions.importPreview.categories')}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {data.categories?.map((c) => (
                      <Badge
                        key={`${c.name}-${Math.random().toString(36).substring(2, 9)}`}
                        variant="outline"
                        className="font-normal"
                        style={{ borderLeftColor: c.color, borderLeftWidth: '4px' }}
                      >
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Standalone Payments Section */}
              {payCount > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <History className="w-3 h-3" />
                    {t('subscriptions.importPreview.payments')}
                  </h5>
                  <div className="space-y-1">
                    {data.payments?.map((p) => (
                      <div
                        key={`${p.subscriptionName}-${Math.random().toString(36).substring(2, 9)}`}
                        className="text-xs flex justify-between items-center py-1.5 border-b last:border-0 border-accent/50"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="truncate font-medium">{p.subscriptionName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(p.paidAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-mono text-muted-foreground">
                          {p.amount} {p.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subCount === 0 && catCount === 0 && payCount === 0 && (
                <p className="text-xs text-center text-muted-foreground py-8">
                  No items found in file
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('subscriptions.importPreview.cancel')}
          </Button>
          <Button
            onClick={() => onConfirm(replaceExisting)}
            disabled={isLoading}
            className="gap-2 text-white"
          >
            {isLoading ? t('common.loading') : t('subscriptions.importPreview.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
