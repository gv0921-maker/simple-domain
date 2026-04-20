// CRM Email Composer — opens user's mail client via mailto: and logs an Activity.
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
import { Mail, ExternalLink } from 'lucide-react';
import { saveActivity } from '@/lib/data/crm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  defaultSubject?: string;
  relatedTo: 'contact' | 'opportunity' | 'company' | 'lead';
  relatedId: string;
  onLogged?: () => void;
}

export function EmailComposerDialog({
  open, onOpenChange, defaultTo = '', defaultSubject = '', relatedTo, relatedId, onLogged,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState('');

  const reset = () => { setTo(defaultTo); setCc(''); setSubject(defaultSubject); setBody(''); };

  const handleSend = () => {
    if (!to.trim()) {
      toast({ title: 'Recipient required', variant: 'destructive' });
      return;
    }
    const params = new URLSearchParams();
    if (cc) params.set('cc', cc);
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    const href = `mailto:${encodeURIComponent(to)}?${params.toString()}`;
    window.location.href = href;

    // Log as completed email activity
    saveActivity({
      type: 'email',
      subject: `Email: ${subject || '(no subject)'} → ${to}`,
      description: body,
      relatedTo,
      relatedId,
      userId: user?.id || '',
      userName: user?.name || 'User',
      completed: true,
      completedAt: new Date().toISOString(),
    });
    toast({ title: 'Email opened in your mail client', description: 'Activity logged in the timeline.' });
    onLogged?.();
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Send email
          </DialogTitle>
          <DialogDescription>
            Opens your default mail client and logs the email as an activity.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Cc</Label>
            <Input value={cc} onChange={(e) => setCc(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} className="gap-2">
            <ExternalLink className="h-3.5 w-3.5" /> Open mail client & log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
