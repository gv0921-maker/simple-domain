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
      <Card className="p-3 flex flex-col items-center justify-center gap-2 card-hover hover:shadow-lg cursor-pointer group bg-card border-border/40 aspect-square">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0 overflow-hidden">
          {CustomIcon ? (
            <CustomIcon />
          ) : (
            <div className="w-full h-full bg-muted rounded-lg" />
          )}
        </div>
        <div className="flex flex-col items-center min-w-0 text-center">
          <span className="text-sm font-semibold text-foreground truncate">{name}</span>
          {description && (
            <span className="text-xs text-muted-foreground line-clamp-2">{description}</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
