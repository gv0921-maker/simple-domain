import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import {
  useNotificationPreferences,
  useUpdatePreferences,
  useSubscribeBrowserPush,
  useUnsubscribeBrowserPush,
  useSendTestNotification,
} from '@/hooks/notifications';
import { toast } from '@/hooks/use-toast';
import { playNotificationSound } from '@/lib/notifications/sound';

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'sales', label: 'Sales' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'manufacturing', label: 'Manufacturing' },
  { key: 'hr', label: 'HR' },
  { key: 'returns', label: 'Returns' },
  { key: 'vendor_orders', label: 'Vendor Orders' },
  { key: 'chat', label: 'Chat' },
  { key: 'system', label: 'System' },
];

export default function NotificationSettings() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const update = useUpdatePreferences();
  const subscribe = useSubscribeBrowserPush();
  const unsubscribe = useUnsubscribeBrowserPush();
  const test = useSendTestNotification();

  const [local, setLocal] = useState<any>(null);

  useEffect(() => {
    if (prefs && !local) {
      setLocal({
        in_app_enabled: prefs.in_app_enabled ?? true,
        in_app_sound_enabled: prefs.in_app_sound_enabled ?? true,
        browser_push_enabled: prefs.browser_push_enabled ?? false,
        quiet_hours_start: prefs.quiet_hours_start ?? '',
        quiet_hours_end: prefs.quiet_hours_end ?? '',
        categories: prefs.categories ?? {},
      });
    }
  }, [prefs, local]);

  if (isLoading || !local) {
    return (
      <AppLayout title="Settings" subtitle="Notifications" moduleNav={SETTINGS_NAV}>
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  const setField = (k: string, v: any) => setLocal({ ...local, [k]: v });
  const setCategory = (k: string, v: boolean) => setLocal({ ...local, categories: { ...local.categories, [k]: v } });

  async function save() {
    try {
      await update.mutateAsync(local);
      toast({ title: 'Preferences saved' });
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e?.message, variant: 'destructive' });
    }
  }

  async function togglePush(v: boolean) {
    try {
      if (v) {
        const ok = await subscribe.mutateAsync();
        if (!ok) {
          toast({ title: 'Permission denied', description: 'Browser blocked notifications.', variant: 'destructive' });
          return;
        }
        setField('browser_push_enabled', true);
        toast({ title: 'Browser notifications enabled' });
      } else {
        await unsubscribe.mutateAsync();
        setField('browser_push_enabled', false);
      }
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
    }
  }

  return (
    <AppLayout title="Settings" subtitle="Notifications" moduleNav={SETTINGS_NAV}>
      <div className="p-4 space-y-4 max-w-3xl">
        <Card className="p-5 space-y-4">
          <h3 className="text-base font-semibold">Delivery</h3>
          <Row label="In-app notifications" desc="Show in the bell menu and notifications page.">
            <Switch checked={local.in_app_enabled} onCheckedChange={(v) => setField('in_app_enabled', v)} />
          </Row>
          <Row label="Notification sounds" desc="Play a tone when a new notification arrives.">
            <div className="flex items-center gap-2">
              <Switch checked={local.in_app_sound_enabled} onCheckedChange={(v) => setField('in_app_sound_enabled', v)} />
              <Button variant="outline" size="sm" onClick={() => playNotificationSound('general')}>Test sound</Button>
              <Button variant="outline" size="sm" onClick={() => playNotificationSound('chat')}>Chat</Button>
              <Button variant="outline" size="sm" onClick={() => playNotificationSound('urgent')}>Urgent</Button>
            </div>
          </Row>
          <Row label="Browser push notifications" desc="Show desktop alerts even when the tab is in background.">
            <Switch checked={local.browser_push_enabled} onCheckedChange={togglePush} />
          </Row>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-base font-semibold">Quiet hours</h3>
          <p className="text-sm text-muted-foreground">Mutes non-urgent notifications during these hours. Leave blank to disable.</p>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="time" value={local.quiet_hours_start} onChange={(e) => setField('quiet_hours_start', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="time" value={local.quiet_hours_end} onChange={(e) => setField('quiet_hours_end', e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="text-base font-semibold">Categories</h3>
          <p className="text-sm text-muted-foreground">Choose which categories you want to receive.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <Row key={c.key} label={c.label}>
                <Switch
                  checked={local.categories?.[c.key] !== false}
                  onCheckedChange={(v) => setCategory(c.key, v)}
                />
              </Row>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => test.mutate(undefined, {
            onSuccess: () => toast({ title: 'Test notification sent', description: 'Check your bell icon.' }),
            onError: (e: any) => toast({ title: 'Failed', description: e?.message, variant: 'destructive' }),
          })}>
            Send test notification
          </Button>
          <Button onClick={save} disabled={update.isPending}>Save preferences</Button>
        </div>
      </div>
    </AppLayout>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}