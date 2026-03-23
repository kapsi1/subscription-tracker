'use client';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import {
  ChineseFlag,
  FrenchFlag,
  GermanFlag,
  ItalianFlag,
  JapaneseFlag,
  KoreanFlag,
  PolandFlag,
  PortugalFlag,
  RussianFlag,
  SpanishFlag,
  UKFlag,
} from '@/components/flags';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/components/ui/utils';
import api from '@/lib/api';
import { changeI18nLanguage } from '@/lib/i18n';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

const LANGUAGES = [
  { code: 'en', labelKey: 'language.en', Flag: UKFlag },
  { code: 'pl', labelKey: 'language.pl', Flag: PolandFlag },
  { code: 'de', labelKey: 'language.de', Flag: GermanFlag },
  { code: 'es', labelKey: 'language.es', Flag: SpanishFlag },
  { code: 'fr', labelKey: 'language.fr', Flag: FrenchFlag },
  { code: 'it', labelKey: 'language.it', Flag: ItalianFlag },
  { code: 'pt', labelKey: 'language.pt', Flag: PortugalFlag },
  { code: 'ru', labelKey: 'language.ru', Flag: RussianFlag },
  { code: 'zh', labelKey: 'language.zh', Flag: ChineseFlag },
  { code: 'ja', labelKey: 'language.ja', Flag: JapaneseFlag },
  { code: 'ko', labelKey: 'language.ko', Flag: KoreanFlag },
];

export function LanguageSelector({ className, showLabel = false }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const currentLangCode = (i18n.language || 'en').split('-')[0];
  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  const handleLanguageChange = async (lang: string) => {
    try {
      await changeI18nLanguage(lang);
      // Only sync with backend if user is logged in
      if (isAuthenticated) {
        await api.patch('/users/settings', { language: lang });
      }
    } catch (_error) {
      // Don't toast error if it's just a guest changing language
      if (isAuthenticated) {
        toast.error(t('common.error'));
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? 'default' : 'icon'}
          className={cn('h-9', showLabel ? 'gap-2 px-3' : 'w-9', className)}
          aria-label={t('language.switch')}
        >
          <currentLang.Flag />
          {showLabel && <span>{t(currentLang.labelKey)}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto overflow-x-hidden">
        <DropdownMenuLabel>{t('language.switch')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              'gap-2 cursor-pointer',
              currentLangCode === lang.code && 'bg-accent/50 font-medium',
            )}
          >
            <lang.Flag /> <span>{t(lang.labelKey)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
