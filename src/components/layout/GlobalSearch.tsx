// Global Search Component — searches across all CRM and app modules
import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  User,
  
  TrendingUp,
  Package,
  ShoppingCart,
  FileText,
  Factory,
  Settings,
  X,
} from 'lucide-react';
import { getContacts, getOpportunities } from '@/lib/data/crm';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  module: string;
  icon: React.ElementType;
  href: string;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];


    // CRM Contacts
    try {
      getContacts().filter(c =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      ).slice(0, 3).forEach(c => {
        items.push({ id: c.id, title: `${c.firstName} ${c.lastName}`, subtitle: c.email, module: 'Contact', icon: User, href: `/crm/contacts/${c.id}` });
      });
    } catch {}

    // CRM Opportunities
    try {
      getOpportunities().filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.contactName.toLowerCase().includes(q)
      ).slice(0, 3).forEach(o => {
        items.push({ id: o.id, title: o.name, subtitle: `₹${o.expectedRevenue.toLocaleString('en-IN')}`, module: 'Opportunity', icon: TrendingUp, href: `/crm/opportunities/${o.id}` });
      });
    } catch {}

    // Module navigation shortcuts
    const modules = [
      { name: 'CRM', href: '/crm', icon: TrendingUp },
      { name: 'CRM Contacts', href: '/crm/contacts', icon: User },
      { name: 'Inventory', href: '/inventory', icon: Package },
      { name: 'Inventory Products', href: '/inventory/products', icon: Package },
      { name: 'Sales', href: '/sales', icon: ShoppingCart },
      { name: 'Sales Quotations', href: '/sales/quotations', icon: FileText },
      { name: 'Sales Orders', href: '/sales/orders', icon: ShoppingCart },
      { name: 'Manufacturing', href: '/manufacturing', icon: Factory },
      { name: 'Accounting', href: '/accounting', icon: FileText },
      { name: 'Settings', href: '/settings', icon: Settings },
    ];

    modules.filter(m => m.name.toLowerCase().includes(q)).slice(0, 3).forEach(m => {
      items.push({ id: m.href, title: m.name, module: 'Navigation', icon: m.icon, href: m.href });
    });

    return items.slice(0, 10);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex items-center gap-2 h-8 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground ml-auto">
          ⌘K
        </kbd>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-[400px] bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-scale-in">
          <div className="flex items-center gap-2 px-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search leads, contacts, modules..."
              className="h-10 flex-1 bg-transparent border-0 outline-none text-sm"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto py-1">
              {results.map(result => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      {result.subtitle && <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{result.module}</Badge>
                  </button>
                );
              })}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No results found</div>
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}
    </div>
  );
}
