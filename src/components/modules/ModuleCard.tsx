import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { MODULE_ICONS } from '@/components/icons/ModuleIcons';

interface ModuleCardProps {
  id: string;
  name: string;
  description?: string;
  href: string;
}

export function ModuleCard({ id, name, description, href }: ModuleCardProps) {
  const CustomIcon = MODULE_ICONS[id];

  return (
    <Link to={href}>
      <Card className="p-4 flex items-center gap-4 card-hover hover:shadow-lg cursor-pointer group bg-card border-border/40 min-h-[72px]">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0 overflow-hidden">
          {CustomIcon ? (
            <CustomIcon />
          ) : (
            <div className="w-full h-full bg-muted rounded-lg" />
          )}
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
