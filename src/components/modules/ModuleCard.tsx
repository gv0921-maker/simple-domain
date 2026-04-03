import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { MODULE_ICONS } from '@/components/icons/ModuleIcons';

const MODULE_BG: Record<string, string> = {
  crm: '#e0f2f1',
  sales: '#fbe9e7',
  inventory: '#fce4ec',
  manufacturing: '#e3f2fd',
  plm: '#f3e5f5',
  accounting: '#e0f7fa',
  employees: '#fff8e1',
  discuss: '#fff3e0',
  dashboards: '#e8f5e9',
  settings: '#f5f5f5',
  'shop-floor': '#e0f7fa',
  barcode: '#fce4ec',
  apps: '#e0f7fa',
  invoicing: '#e8eaf6',
  maintenance: '#ffebee',
  calendar: '#f3e5f5',
  helpdesk: '#e0f7fa',
  'email-marketing': '#fce4ec',
  website: '#e3f2fd',
};

interface ModuleCardProps {
  id: string;
  name: string;
  description?: string;
  href: string;
}

export function ModuleCard({ id, name, description, href }: ModuleCardProps) {
  const CustomIcon = MODULE_ICONS[id];
  const bg = MODULE_BG[id] || '#f5f5f5';

  return (
    <Link to={href}>
      <Card className="p-4 flex items-center gap-4 card-hover hover:shadow-lg cursor-pointer group bg-card border-border/40 min-h-[72px]">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0 overflow-hidden p-2"
          style={{ backgroundColor: bg }}
        >
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