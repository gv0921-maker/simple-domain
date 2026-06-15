import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { ModuleNav, type ModuleNavInput } from './ModuleNav';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { InstallPWAPrompt } from '@/components/pwa/InstallPWAPrompt';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  moduleNav?: ModuleNavInput;
}

export function AppLayout({ children, title, subtitle, moduleNav }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OfflineIndicator />
      <TopNav title={title} subtitle={subtitle} />
      {moduleNav && (moduleNav as any[]).length > 0 && <ModuleNav items={moduleNav} />}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">{children}</main>
      <InstallPWAPrompt />
    </div>
  );
}
