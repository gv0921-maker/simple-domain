import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';
import { SETTINGS_NAV } from '@/lib/navigation/settings';

export default function BackupsSettings() {
  return (
    <AppLayout title="Backups" moduleNav={SETTINGS_NAV}>
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Backups</CardTitle>
                <CardDescription>Scheduled snapshots, restores, and offsite copies.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The Backups feature is coming soon. Until then, please use your hosting provider's snapshot tools for disaster-recovery copies.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
