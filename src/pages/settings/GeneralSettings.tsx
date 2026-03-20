import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building,
  Globe,
  Palette,
  Bell,
  Lock,
  Database,
  Save,
} from 'lucide-react';

import { SETTINGS_NAV } from '@/lib/navigation/settings';

export default function GeneralSettings() {
  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-medium text-foreground">General Settings</h1>
          <Button className="gap-1">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Company Information */}
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-5 w-5 text-primary" />
              <h2 className="text-base font-medium">Company Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" defaultValue="My Company" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email</Label>
                <Input id="company-email" type="email" defaultValue="contact@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Phone</Label>
                <Input id="company-phone" defaultValue="+1 555-0123" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-website">Website</Label>
                <Input id="company-website" defaultValue="https://company.com" />
              </div>
            </div>
          </Card>

          {/* Localization */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-base font-medium">Localization</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Input defaultValue="English" readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input defaultValue="India Standard Time (IST)" readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input defaultValue="INR (₹)" readOnly className="bg-muted" />
              </div>
            </div>
          </Card>

          {/* Appearance */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="text-base font-medium">Appearance</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Use dark theme</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Reduce Animations</p>
                  <p className="text-xs text-muted-foreground">Disable micro-animations for accessibility</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Compact Mode</p>
                  <p className="text-xs text-muted-foreground">Show more content with less spacing</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-base font-medium">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive email alerts for important events</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Browser Notifications</p>
                  <p className="text-xs text-muted-foreground">Show desktop notifications</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Low Stock Alerts</p>
                  <p className="text-xs text-muted-foreground">Notify when products reach reorder level</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-base font-medium">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Session Timeout</p>
                  <p className="text-xs text-muted-foreground">Automatically log out inactive users</p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Login Rate Limiting</p>
                  <p className="text-xs text-muted-foreground">Limit failed login attempts</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          {/* Database */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-base font-medium">Data Management</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Audit Log Retention</p>
                  <p className="text-xs text-muted-foreground">How long to keep audit logs</p>
                </div>
                <Select defaultValue="90">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Auto-Backup</p>
                  <p className="text-xs text-muted-foreground">Automatically backup data</p>
                </div>
                <Select defaultValue="daily">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
