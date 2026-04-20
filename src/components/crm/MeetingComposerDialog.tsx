// CRM Meeting Composer — schedules a meeting Activity and exports to Google/.ics.
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Download, ExternalLink } from 'lucide-react';
import { saveActivity, type Activity } from '@/lib/data/crm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { downloadICS, googleCalendarUrl } from '@/lib/crm/ics';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedTo: 'contact' | 'opportunity' | 'company' | 'lead';
  relatedId: string;
  defaultSubject?: string;
  onLogged?: () => void;
}

function defaultDateTime(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  d.setHours(10);
  return d.toISOString().slice(0, 16);
}

export function MeetingComposerDialog({
  open, onOpenChange, relatedTo, relatedId, defaultSubject = 'Meeting', onLogged,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState(defaultSubject);
  const [when, setWhen] = useState(defaultDateTime());
  const [description, setDescription] = useState('');

  const buildActivity = (): Activity => ({
    id: 'preview',
    type: 'meeting',
    subject,
    description,
    relatedTo,
    relatedId,
    userId: user?.id || '',
    userName: user?.name || 'User',
    dueDate: new Date(when).toISOString(),
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const persist = (): Activity =>
    saveActivity({
      type: 'meeting',
      subject,
      description,
      relatedTo,
      relatedId,
      userId: user?.id || '',
      userName: user?.name || 'User',
      dueDate: new Date(when).toISOString(),
      completed: false,
    });

  const handleSchedule = () => {
    if (!subject.trim()) {
      toast({ title: 'Subject required', variant: 'destructive' });
      return;
    }
    persist();
    toast({ title: 'Meeting scheduled' });
    onLogged?.();
    onOpenChange(false);
  };

  const handleAddToGoogle = () => {
    if (!subject.trim()) return;
    const a = persist();
    window.open(googleCalendarUrl(a), '_blank');
    toast({ title: 'Opened Google Calendar' });
    onLogged?.();
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (!subject.trim()) return;
    const a = persist();
    downloadICS([a], `meeting-${a.id}.ics`);
    toast({ title: 'Calendar invite downloaded' });
    onLogged?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Schedule meeting
          </DialogTitle>
          <DialogDescription>Creates a meeting activity and lets you sync it to your calendar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">When</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={handleDownload} className="gap-1">
            <Download className="h-3.5 w-3.5" /> Download .ics
          </Button>
          <Button variant="outline" onClick={handleAddToGoogle} className="gap-1">
            <ExternalLink className="h-3.5 w-3.5" /> Google Calendar
          </Button>
          <Button onClick={handleSchedule}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
