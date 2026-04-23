// TODO: Replace localStorage with Supabase queries
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send } from 'lucide-react';
import { saveActivity } from '@/lib/data/crm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmailComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  relatedTo: 'contact' | 'opportunity';
  relatedId: string;
}

export function EmailComposerDialog({
  open, onOpenChange, defaultTo = '', relatedTo, relatedId,
}: EmailComposerDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = () => {
    if (!to || !subject) return;
    saveActivity({
      type: 'email',
      subject: `Email to ${to}: ${subject}`,
      description: body,
      relatedTo,
      relatedId,
      userId: user?.id || '',
      userName: user?.name || 'System',
      completed: true,
      completedAt: new Date().toISOString(),
    });
    toast({ title: 'Email logged', description: 'Email activity recorded in timeline.' });
    setSubject('');
    setBody('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Compose Email
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">To</Label>
            <Input value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} rows={6} />
          </div>
          <p className="text-xs text-muted-foreground">
            This is a simulated email — it will be logged as an activity in the CRM timeline.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={!to || !subject}>
            <Send className="h-4 w-4 mr-1" /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}