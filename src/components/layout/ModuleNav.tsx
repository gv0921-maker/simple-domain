import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
}

interface ModuleNavProps {
  items: NavItem[];
}

export function ModuleNav({ items }: ModuleNavProps) {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Auto-scroll active item into view on mobile
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <nav
      ref={scrollRef}
      className="flex items-center gap-4 md:gap-6 border-b border-border bg-card px-4 h-10 overflow-x-auto scrollbar-hide"
    >
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            ref={isActive ? activeRef : undefined}
            className={cn(
              'text-sm font-medium transition-colors duration-150 relative py-2 whitespace-nowrap shrink-0',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
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
  );
}
