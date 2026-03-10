import type React from 'react';
import { cn } from '@/components/ui/utils';

interface FlagProps extends React.HTMLAttributes<HTMLImageElement> {
  countryCode: string;
}

export const Flag = ({ countryCode, className, ...props }: FlagProps) => {
  // Map country codes to flagpedia SVGs or similar
  // flagpedia uses lowercase codes
  const code = countryCode.toLowerCase();
  
  // Special case for EU
  const finalCode = code === 'eu' ? 'eu' : code;

  return (
    <img
      src={`https://flagcdn.com/${finalCode}.svg`}
      alt={`${countryCode} Flag`}
      className={cn("w-5 h-3.5 object-cover rounded-[1px] shadow-[0_0_0_1px_rgba(0,0,0,0.1)]", className)}
      loading="lazy"
      {...props}
    />
  );
};

export const UKFlag = () => <Flag countryCode="gb" />;
export const PolandFlag = () => <Flag countryCode="pl" />;
