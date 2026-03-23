'use client';

import { AlertCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImportErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: string[];
  importData: Record<string, unknown> | null;
}

export function ImportErrorModal({
  open,
  onOpenChange,
  errors,
  importData,
}: ImportErrorModalProps) {
  const { t } = useTranslation();

  // Group errors by their path prefix (e.g., "subscriptions.19")
  const groupedErrors = errors.reduce((acc, error) => {
    // Typical format: "subscriptions.19.field must be X"
    const match = error.match(/^(subscriptions|categories|payments)\.(\d+)\.(.+)$/);
    if (match) {
      const [, type, indexStr, message] = match;
      const index = parseInt(indexStr, 10);
      const key = `${type}.${index}`;
      if (!acc[key]) {
        acc[key] = {
          type,
          index,
          messages: [],
        };
      }
      acc[key].messages.push(message);
    } else {
      // Fallback for generic errors
      if (!acc['general']) {
        acc['general'] = { type: 'general', index: -1, messages: [] };
      }
      acc['general'].messages.push(error);
    }
    return acc;
  }, {} as Record<string, { type: string; index: number; messages: string[] }>);

  const translateError = (error: string) => {
    let translated = error;

    // Simple phrase replacement for common errors
    const phrases = [
      { search: 'Invalid input', key: 'invalid' },
      { search: 'expected number, received string', key: 'expectedNumber' },
      { search: 'must not be less than', key: 'notLessThan' },
      { search: 'must be an integer number', key: 'mustBeInteger' },
      { search: 'must be an array', key: 'mustBeArray' },
      { search: 'each value in', key: 'eachValue' },
      { search: 'Too small: expected number to be >=1', key: 'tooSmall' }
    ];

    for (const phrase of phrases) {
      if (translated.includes(phrase.search)) {
        translated = translated.replace(phrase.search, t(`subscriptions.errorPhrases.${phrase.key}`));
      }
    }

    return translated;
  };

  const getSnippet = (type: string, index: number) => {
    if (type === 'general' || !importData) return null;
    try {
      const categoryData = importData[type];
      if (!Array.isArray(categoryData)) return null;
      const data = categoryData[index];
      if (!data) return null;
      return JSON.stringify(data, null, 2);
    } catch (_e) {
      return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              {t('subscriptions.importErrorTitle', { defaultValue: 'Import Errors Found' })}
            </DialogTitle>
            <DialogDescription>
              {t('subscriptions.importErrorDesc', { defaultValue: 'We found some issues in your file. Please fix them and try again.' })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="space-y-6 pb-4">
            {Object.entries(groupedErrors).map(([key, group]) => {
              const snippet = getSnippet(group.type, group.index);
              const items = group.type !== 'general' ? importData?.[group.type] : null;
              const item = Array.isArray(items) ? (items[group.index] as Record<string, unknown> | undefined) : null;
               const itemName = (item?.name as string | undefined) || 
                               (item?.subscriptionName as string | undefined) || 
                               (group.type !== 'general' && `${t(`subscriptions.importPreview.${group.type}`)} #${group.index + 1}`);

              return (
                <div key={key} className="rounded-lg border border-destructive/20 overflow-hidden bg-destructive/5 dark:bg-destructive/10">
                  <div className="bg-destructive/10 px-4 py-2 border-b border-destructive/20 flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-2">
                       {group.type === 'general' ? (
                         t('subscriptions.generalError', { defaultValue: 'General Error' })
                       ) : (
                         <>
                           <span className="capitalize">{t(`subscriptions.importPreview.${group.type}`)}</span>
                           <ChevronRight className="w-3 h-3 text-muted-foreground" />
                           <span className="text-destructive font-mono text-[10px] bg-destructive/10 px-1 rounded">#{group.index}</span>
                           <span className="text-destructive truncate max-w-[200px]">{itemName}</span>
                         </>
                       )}
                    </span>
                  </div>
                  <div className="p-4 space-y-4">
                    <ul className="list-disc list-inside space-y-1">
                      {group.messages.map((msg, idx) => (
                        <li key={`${key}-${idx}-${msg.length}`} className="text-sm text-foreground/90">
                          {translateError(msg)}
                        </li>
                      ))}
                    </ul>

                    {snippet && (
                      <div className="relative group">
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-background/80 border text-muted-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                          {t('subscriptions.jsonSnippet', { defaultValue: 'JSON snippet' })}
                        </div>
                        <pre className="p-4 rounded-md bg-zinc-950 text-zinc-50 font-mono text-xs overflow-x-auto border shadow-inner">
                          {snippet}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 pt-2 border-t mt-auto">
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.close', { defaultValue: 'Close' })}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
