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
