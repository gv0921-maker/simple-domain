import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  findSectionForPath,
  type SettingsNavSection,
} from '@/lib/navigation/settings';

interface NavItem {
  label: string;
  href: string;
}

export type ModuleNavInput = NavItem[] | SettingsNavSection[];

interface ModuleNavProps {
  items: ModuleNavInput;
}

function isGrouped(items: ModuleNavInput): items is SettingsNavSection[] {
  return items.length > 0 && (items[0] as any).items !== undefined;
}

export function ModuleNav({ items: rawItems }: ModuleNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!rawItems || rawItems.length === 0) return null;

  // Grouped (settings sections): render only the items in the section that
  // contains the active route. Falls back to the first section's items.
  let items: NavItem[];
  if (isGrouped(rawItems)) {
    const section =
      findSectionForPath(rawItems, location.pathname) ?? rawItems[0];
    items = section.items.map(({ label, href }) => ({ label, href }));
  } else {
    items = rawItems;
  }

  if (items.length === 0) return null;

  // Pick the longest matching href so nested routes like '/crm/contacts'
  // win over the parent index route '/crm'.
  const activeItem =
    [...items]
      .sort((a, b) => b.href.length - a.href.length)
      .find(
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
