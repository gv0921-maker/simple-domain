import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import glfLogo from '@/assets/glf-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Settings,
  LogOut,
  Menu,
  Home,
} from 'lucide-react';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { NotificationsBell } from '@/components/layout/NotificationsBell';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { canAccessRoute } from '@/lib/services/settings';
import { isSuperAdminUser } from '@/lib/data/rbac';

interface TopNavProps {
  title?: string;
  subtitle?: string;
  moduleNav?: { label: string; href: string }[];
}

export function TopNav({ title, subtitle, moduleNav }: TopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mobileNavItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Inventory', href: '/inventory' },
    { label: 'Sales', href: '/sales' },
    { label: 'Barcode', href: '/barcode' },
    { label: 'Manufacturing', href: '/manufacturing' },
    { label: 'Invoices', href: '/invoicing' },
    { label: 'CRM', href: '/crm' },
    { label: 'Settings', href: '/settings', icon: Settings },
  ].filter((item) => (user ? canAccessRoute(user.id, item.href) : false));

  const filteredModuleNav =
    moduleNav?.filter((item) => (user ? canAccessRoute(user.id, item.href) : false)) || [];

  const handleLogout = () => {
    logout();
    navigate('/select-user');
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-3 md:px-4">
      {/* Left side */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="flex items-center gap-2">
                <img src={glfLogo} alt="GLF Logo" className="h-8 w-8 rounded-full object-contain" />
                <span className="font-bold text-foreground">GLF ERP</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="p-2 space-y-1">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => navigate(item.href)}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          <img src={glfLogo} alt="GLF Logo" className="h-8 w-8 rounded-full object-contain" />
          <span className="text-sm font-bold text-foreground hidden sm:inline">GLF</span>
        </Link>
        {title && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-foreground font-medium truncate">{title}</span>
            {subtitle && (
              <>
                <span className="text-muted-foreground hidden sm:inline">/</span>
                <span className="text-muted-foreground hidden sm:inline truncate">{subtitle}</span>
              </>
            )}
          </div>
        )}

        {/* Module sub-navigation inline */}
        {filteredModuleNav.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {filteredModuleNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'text-sm px-3 py-1.5 rounded-md transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {user && isSuperAdminUser(user.id) && <GlobalSearch />}
        <NotificationsBell />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 animate-scale-in">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            {user && canAccessRoute(user.id, '/settings') && (
              <>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
