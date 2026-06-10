import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { MobileBottomTabs } from './MobileBottomTabs';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { InstallPWAPrompt } from '@/components/pwa/InstallPWAPrompt';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  moduleNav?: { label: string; href: string }[];
}

export function AppLayout({ children, title, subtitle, moduleNav }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OfflineIndicator />
      <TopNav title={title} subtitle={subtitle} moduleNav={moduleNav} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      <MobileBottomTabs />
      <InstallPWAPrompt />
    </div>
  );
}
