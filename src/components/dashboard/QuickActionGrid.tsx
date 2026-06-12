import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface QuickAction {
  label: string;
  href: string;
  icon?: LucideIcon;
  variant?: 'default' | 'primary';
}

export function QuickActionGrid({ actions, className }: { actions: QuickAction[]; className?: string }) {
  if (!actions.length) return null;
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3', className)}>
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link key={a.href + a.label} to={a.href} className="block">
            <Card
              className={cn(
                'p-4 flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition cursor-pointer h-full',
                a.variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="text-xs font-medium">{a.label}</span>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}