import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ModuleCardProps {
  name: string;
  description?: string;
  icon: LucideIcon;
  href: string;
  iconBg?: string;
  iconColor?: string;
}

export function ModuleCard({ name, description, icon: Icon, href, iconBg, iconColor }: ModuleCardProps) {
  return (
    <Link to={href}>
      <Card className="p-4 flex items-center gap-4 card-hover hover:shadow-lg cursor-pointer group bg-card border-border/40 min-h-[72px]">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0"
          style={{ backgroundColor: iconBg || 'hsl(var(--secondary))' }}
        >
          <Icon
            className="w-6 h-6 transition-transform duration-200"
            style={{ color: iconColor || 'hsl(var(--foreground))' }}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{name}</span>
          {description && (
            <span className="text-xs text-muted-foreground truncate">{description}</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
