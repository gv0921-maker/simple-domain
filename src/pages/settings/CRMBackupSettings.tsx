// CRM-only encrypted backup / restore
import { useRef, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Database, Download, Upload, Lock } from 'lucide-react';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import {
  exportCRM, importCRM, encryptBackup, decryptBackup, downloadJson,
  type CRMBackup,
} from '@/lib/crm/backup';
import { useToast } from '@/hooks/use-toast';

export default function CRMBackupSettings() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [encryptOnExport, setEncryptOnExport] = useState(true);
  const [passphrase, setPassphrase] = useState('');

  const handleExport = async () => {
    const backup = exportCRM();
    try {
      if (encryptOnExport) {
        if (passphrase.length < 8) {
          toast({ title: 'Passphrase must be at least 8 characters', variant: 'destructive' });
          return;
        }
        const enc = await encryptBackup(backup, passphrase);
        downloadJson(`crm-backup-${todayStamp()}.enc.json`, enc);
      } else {
        downloadJson(`crm-backup-${todayStamp()}.json`, JSON.stringify(backup, null, 2));
      }
      toast({ title: 'Backup downloaded' });
    } catch (e) {
      toast({ title: 'Export failed', description: String(e), variant: 'destructive' });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      let backup: CRMBackup;
      if (obj.encrypted) {
        if (!passphrase) {
          toast({ title: 'Enter the passphrase used when exporting', variant: 'destructive' });
          return;
        }
        backup = await decryptBackup(text, passphrase);
      } else {
        backup = obj;
      }
      const r = importCRM(backup);
      toast({ title: `Restored ${r.restored} datasets — please refresh the page` });
    } catch (e) {
      toast({ title: 'Import failed', description: String(e), variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4 max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-medium">CRM Backup &amp; Restore</h1>
            <p className="text-sm text-muted-foreground">
              Export and re-import all CRM data (contacts, opportunities, activities, notes, pipelines)
            </p>
          </div>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Encrypt with passphrase (AES-256-GCM)</Label>
            <Switch checked={encryptOnExport} onCheckedChange={setEncryptOnExport} className="ml-auto" />
          </div>
          {encryptOnExport && (
            <Input
              type="password"
              placeholder=""
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Passphrases are never stored. Lose it and the backup cannot be recovered.
          </p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Download className="h-4 w-4" /> Export
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Download a JSON snapshot of all CRM records.
            </p>
            <Button className="w-full" onClick={handleExport}>Download backup</Button>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4" /> Restore
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Upload a previous CRM backup file. Existing data will be overwritten.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                if (e.target) e.target.value = '';
              }}
            />
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              Choose file…
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
