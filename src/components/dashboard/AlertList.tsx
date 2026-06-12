import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertItem {
  id: string;
  level: 'info' | 'warning' | 'danger';
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

const styles = {
  info: { wrap: 'border-l-4 border-l-primary', icon: Info, color: 'text-primary' },
  warning: { wrap: 'border-l-4 border-l-amber-500', icon: AlertTriangle, color: 'text-amber-600' },
  danger: { wrap: 'border-l-4 border-l-destructive', icon: AlertCircle, color: 'text-destructive' },
};

export function AlertList({ items, emptyMessage = 'No alerts' }: { items: AlertItem[]; emptyMessage?: string }) {
  if (!items.length) {
    return <Card className="p-4 text-sm text-muted-foreground text-center">{emptyMessage}</Card>;
  }
  return (
    <div className="space-y-2">
      {items.map((a) => {
        const s = styles[a.level];
        const Icon = s.icon;
        return (
          <Card key={a.id} className={cn('p-3 flex items-start gap-3', s.wrap)}>
            <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', s.color)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{a.title}</p>
              {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
            </div>
            {a.actionLabel && a.actionHref && (
              <Button asChild size="sm" variant="outline">
                <Link to={a.actionHref}>{a.actionLabel}</Link>
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}