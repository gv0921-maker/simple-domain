import { Card } from '@/components/ui/card';

export interface RankItem {
  id: string;
  label: string;
  subtitle?: string;
  value: string | number;
}

export function MiniRanking({ title, items, emptyMessage = 'No data' }: { title?: string; items: RankItem[]; emptyMessage?: string }) {
  return (
    <Card className="p-4">
      {title && <h3 className="text-sm font-semibold mb-3">{title}</h3>}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
      ) : (
        <ol className="space-y-2">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-muted text-xs flex items-center justify-center font-medium shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{it.label}</p>
                {it.subtitle && <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>}
              </div>
              <span className="text-sm font-semibold shrink-0">{it.value}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}