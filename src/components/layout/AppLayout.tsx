import { ReactNode } from 'react';
import { TopNav } from './TopNav';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  moduleNav?: { label: string; href: string }[];
}

export function AppLayout({ children, title, subtitle, moduleNav }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav title={title} subtitle={subtitle} moduleNav={moduleNav} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
