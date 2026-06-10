import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface NavItem {
  label: string;
  href: string;
}

interface ModuleNavProps {
  items: NavItem[];
}

export function ModuleNav({ items }: ModuleNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  const activeItem =
    items.find(
      (i) =>
        location.pathname === i.href ||
        location.pathname.startsWith(i.href + '/'),
    ) ?? items[0];

  return (
    <>
      {/* Desktop: horizontal tabs */}
      <nav className="hidden md:flex items-center gap-6 border-b border-border bg-card px-4 h-10">
        {items.map((item) => {
          const isActive = item === activeItem;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'text-sm font-medium transition-colors duration-150 relative py-2 whitespace-nowrap',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-fade-in" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile: dropdown */}
      <div className="md:hidden border-b border-border bg-card px-3 py-2">
        <Select value={activeItem.href} onValueChange={(v) => navigate(v)}>
          <SelectTrigger className="w-full h-9 text-sm font-medium">
            <SelectValue>{activeItem.label}</SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[70vh]">
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
