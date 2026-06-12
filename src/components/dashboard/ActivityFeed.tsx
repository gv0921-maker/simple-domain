import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Activity } from 'lucide-react';

export interface ActivityItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: string | Date;
  icon?: LucideIcon;
  href?: string;
}

export function ActivityFeed({ items, emptyMessage = 'No recent activity' }: { items: ActivityItem[]; emptyMessage?: string }) {
  if (!items.length) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </Card>
    );
  }
  return (
    <Card className="divide-y">
      {items.map((it) => {
        const Icon = it.icon ?? Activity;
        const date = typeof it.timestamp === 'string' ? new Date(it.timestamp) : it.timestamp;
        return (
          <div key={it.id} className={cn('flex items-start gap-3 p-3', it.href && 'hover:bg-muted/40 cursor-pointer')}>
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{it.title}</p>
              {it.subtitle && <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(date, { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </Card>
  );
}