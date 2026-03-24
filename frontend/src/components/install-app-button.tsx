'use client';

import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

interface InstallAppButtonProps {
  className?: string;
  variant?: 'outline' | 'ghost' | 'default';
  showText?: boolean;
  textClassName?: string;
}

export function InstallAppButton({
  className,
  variant = 'outline',
  showText = true,
  textClassName,
}: InstallAppButtonProps) {
  const { t } = useTranslation();
  const { canInstall, install } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <Button
      variant={variant}
      size="sm"
      className={cn('gap-2 transition-all', className)}
      onClick={install}
    >
      <Download className="h-4 w-4 shrink-0" />
      {showText && <span className={textClassName}>{t('nav.installApp')}</span>}
    </Button>
  );
}
