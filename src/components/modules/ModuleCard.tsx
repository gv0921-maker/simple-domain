import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { MODULE_ICONS } from '@/components/icons/ModuleIcons';

interface ModuleCardProps {
  id: string;
  name: string;
  href: string;
}

export function ModuleCard({ id, name, href }: ModuleCardProps) {
  const CustomIcon = MODULE_ICONS[id];

  return (
    <Link to={href}>
      <Card className="p-4 flex flex-col items-center justify-center gap-3 card-hover hover:shadow-lg cursor-pointer group bg-card border-border/40">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0 overflow-hidden">
          {CustomIcon ? (
            <CustomIcon />
          ) : (
            <div className="w-full h-full bg-muted rounded-lg" />
          )}
        </div>
        <span className="text-sm font-semibold text-foreground text-center truncate w-full">{name}</span>
      </Card>
    </Link>
  );
}
