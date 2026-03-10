import { Link, useNavigate } from 'react-router-dom';
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
  MessageSquare,
  Clock,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  Home,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface TopNavProps {
  title?: string;
  subtitle?: string;
}

export function TopNav({ title, subtitle }: TopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/')}>
                <Home className="h-4 w-4" /> Home
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/inventory')}>
                Inventory
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/sales')}>
                Sales
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/barcode')}>
                Barcode
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/manufacturing')}>
                Manufacturing
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/accounting')}>
                Accounting
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/crm')}>
                CRM
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4" /> Settings
              </Button>
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
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {/* These icons hidden on mobile */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden md:inline-flex">
          <Clock className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden md:inline-flex">
          <Settings className="h-4 w-4" />
        </Button>

        <span className="text-sm text-foreground font-medium ml-1 hidden lg:inline">
          GLF
        </span>

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
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
