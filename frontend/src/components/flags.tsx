import Image from 'next/image';
import { cn } from '@/components/ui/utils';

interface FlagProps {
  countryCode: string;
  className?: string;
}

export const Flag = ({ countryCode, className }: FlagProps) => {
  // Map country codes to flagpedia SVGs or similar
  // flagpedia uses lowercase codes
  const code = countryCode.toLowerCase();

  // Special case for EU
  const finalCode = code === 'eu' ? 'eu' : code;

  return (
    <Image
      src={`https://flagcdn.com/${finalCode}.svg`}
      alt={`${countryCode} Flag`}
      width={20}
      height={14}
      style={{ width: 20, height: 14 }}
      className={cn('object-cover rounded-[1px] shadow-[0_0_0_1px_rgba(0,0,0,0.1)]', className)}
    />
  );
};

export const UKFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="gb" className={className} />
);
export const PolandFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="pl" className={className} />
);
export const GermanFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="de" className={className} />
);
export const SpanishFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="es" className={className} />
);
export const FrenchFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="fr" className={className} />
);
export const ItalianFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="it" className={className} />
);
export const PortugalFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="pt" className={className} />
);
export const RussianFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="ru" className={className} />
);
export const ChineseFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="cn" className={className} />
);
export const JapaneseFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="jp" className={className} />
);
export const KoreanFlag = ({ className }: { className?: string }) => (
  <Flag countryCode="kr" className={className} />
);
