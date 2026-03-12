'use client';

import { CATEGORY_ICONS } from '@subscription-tracker/shared';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const filteredIcons = CATEGORY_ICONS;

  const iconToResolve = value === 'Tool' ? 'Wrench' : value;
  const SelectedIcon = iconToResolve ? (LucideIcons[iconToResolve as keyof typeof LucideIcons] as LucideIcons.LucideIcon) : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 flex items-center justify-center p-0 overflow-hidden"
          title={t('settings.categories.pickIcon')}
        >
          {SelectedIcon ? (
            <SelectedIcon className="w-7 h-7" style={{ color }} />
          ) : (
            <span className="text-muted-foreground/40 text-[10px]">None</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[290px] p-3 shadow-xl" align="start">
        <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-2">
          {filteredIcons.map((name) => {
            const IconName = name === 'Tool' ? 'Wrench' : name; // Defensive check
            const Icon = LucideIcons[IconName as keyof typeof LucideIcons] as LucideIcons.LucideIcon;
            if (!Icon) return null;
            return (
              <Button
                key={name}
                variant="ghost"
                className={cn(
                  'h-12 w-12 p-0 hover:bg-muted transition-colors shrink-0',
                  value === name && 'bg-muted ring-2 ring-primary/20',
                )}
                onClick={() => {
                  onChange(name);
                  setIsOpen(false);
                }}
                title={name}
              >
                <Icon className="w-8 h-8 stroke-2" style={{ color }} />
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
