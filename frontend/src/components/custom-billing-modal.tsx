import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CustomBillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  days: number[];
  shortageOffset: number;
  shortageDirection: 'before' | 'after' | 'skip';
  onSave: (days: number[], offset: number, direction: 'before' | 'after' | 'skip') => void;
}

export function CustomBillingModal({
  open,
  onOpenChange,
  days,
  shortageOffset,
  shortageDirection,
  onSave,
}: CustomBillingModalProps) {
  const { t } = useTranslation();
  const [selectedDays, setSelectedDays] = useState<number[]>(days);
  const [tempShortageOffset, setTempShortageOffset] = useState<number>(shortageOffset);
  const [tempShortageDirection, setTempShortageDirection] = useState<'before' | 'after' | 'skip'>(
    shortageDirection,
  );

  useEffect(() => {
    if (open) {
      setSelectedDays(days);
      setTempShortageOffset(shortageOffset);
      setTempShortageDirection(shortageDirection);
    }
  }, [days, shortageOffset, shortageDirection, open]);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  const handleSave = () => {
    onSave(selectedDays, tempShortageOffset, tempShortageDirection);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('subscriptions.customBilling.title')}</DialogTitle>
          <DialogDescription>{t('subscriptions.customBilling.desc')}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-7 gap-2 py-4">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <Button
              key={day}
              type="button"
              variant={selectedDays.includes(day) ? 'default' : 'outline'}
              className={cn('h-10 w-10 p-0', selectedDays.includes(day) && 'font-bold')}
              onClick={() => toggleDay(day)}
            >
              {day}
            </Button>
          ))}
        </div>

        {selectedDays.some((d) => d >= 29) && (
          <div className="py-4 border-t space-y-3">
            <p className="text-sm font-medium">{t('subscriptions.customBilling.shortMonth')}</p>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              {tempShortageDirection !== 'skip' && (
                <>
                  <Input
                    type="number"
                    min={0}
                    max={31}
                    value={tempShortageOffset}
                    onChange={(e) => setTempShortageOffset(Math.max(1, Number(e.target.value)))}
                    className="w-16 h-8 text-center"
                  />
                  <span>{t('subscriptions.customBilling.days')}</span>
                </>
              )}
              <Select
                value={tempShortageDirection}
                onValueChange={(v) => setTempShortageDirection(v as 'before' | 'after' | 'skip')}
              >
                <SelectTrigger className="w-auto min-w-[100px] h-8 px-3 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">{t('subscriptions.customBilling.before')}</SelectItem>
                  <SelectItem value="after">{t('subscriptions.customBilling.after')}</SelectItem>
                  <SelectItem value="skip">{t('subscriptions.customBilling.skip')}</SelectItem>
                </SelectContent>
              </Select>
              {tempShortageDirection !== 'skip' && (
                <span className="whitespace-nowrap">
                  {t('subscriptions.customBilling.theSelectedDay')}
                </span>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('subscriptions.customBilling.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={selectedDays.length === 0}>
            {t('subscriptions.customBilling.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
