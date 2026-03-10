import { InboxIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 pt-6 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon || <InboxIcon className="w-10 h-10 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
