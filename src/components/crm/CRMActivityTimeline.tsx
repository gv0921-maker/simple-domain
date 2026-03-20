// Activity Timeline Component for CRM entities
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  Check,
  Bell,
  FileText,
} from 'lucide-react';
import {
  getActivities,
  saveActivity,
  completeActivity,
  type Activity,
  type ActivityType,
  type Note,
  getNotes,
  saveNote,
} from '@/lib/data/crm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { cn } from '@/lib/utils';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: MessageSquare,
  follow_up: Bell,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  call: 'bg-success/10 text-success',
  email: 'bg-info/10 text-info',
  meeting: 'bg-warning/10 text-warning',
  task: 'bg-accent/10 text-accent',
  note: 'bg-muted text-muted-foreground',
  follow_up: 'bg-destructive/10 text-destructive',
};

interface ActivityTimelineItemProps {
  activity: Activity;
  onComplete: (id: string) => void;
}

function ActivityTimelineItem({ activity, onComplete }: ActivityTimelineItemProps) {
  const Icon = ACTIVITY_ICONS[activity.type];
  const colorClass = ACTIVITY_COLORS[activity.type];
  const { canEditOpportunities } = useCRMPermissions();
  
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn('font-medium text-sm', activity.completed && 'line-through text-muted-foreground')}>
              {activity.subject}
            </p>
            {activity.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          {!activity.completed && canEditOpportunities && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onComplete(activity.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{activity.userName}</span>
          <span>•</span>
          <span>{formatDistanceToNow(parseISO(activity.createdAt), { addSuffix: true })}</span>
          {activity.dueDate && !activity.completed && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due {format(parseISO(activity.dueDate), 'MMM d')}
              </span>
            </>
          )}
          {activity.completed && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              Completed
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface NoteItemProps {
  note: Note;
}

function NoteItem({ note }: NoteItemProps) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="p-2 rounded-lg bg-muted shrink-0">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{note.userName}</span>
          <span>•</span>
          <span>{formatDistanceToNow(parseISO(note.createdAt), { addSuffix: true })}</span>
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {note.visibility}
          </Badge>
        </div>
      </div>
    </div>
  );
}

interface CRMActivityTimelineProps {
  relatedTo: 'contact' | 'company' | 'lead' | 'opportunity';
  relatedId: string;
}

export function CRMActivityTimeline({ relatedTo, relatedId }: CRMActivityTimelineProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canEditOpportunities, canEditLeads, canEditContacts } = useCRMPermissions();
  
  const [activities, setActivities] = useState<Activity[]>(() => getActivities(relatedTo, relatedId));
  const [notes, setNotes] = useState<Note[]>(() => getNotes(relatedTo, relatedId));
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    type: 'call',
    subject: '',
    description: '',
  });
  const [newNote, setNewNote] = useState('');

  const canEdit = relatedTo === 'opportunity' ? canEditOpportunities :
                  relatedTo === 'lead' ? canEditLeads : canEditContacts;

  const handleAddActivity = () => {
    if (!newActivity.subject?.trim()) {
      toast({ title: 'Subject is required', variant: 'destructive' });
      return;
    }

    saveActivity({
      ...newActivity,
      relatedTo,
      relatedId,
      userId: user?.id || '',
      userName: user?.name || 'System',
    });

    setActivities(getActivities(relatedTo, relatedId));
    setNewActivity({ type: 'call', subject: '', description: '' });
    setIsAddingActivity(false);
    toast({ title: 'Activity logged' });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast({ title: 'Note content is required', variant: 'destructive' });
      return;
    }

    saveNote({
      content: newNote,
      relatedTo,
      relatedId,
      userId: user?.id || '',
      userName: user?.name || 'System',
      visibility: 'team',
    });

    setNotes(getNotes(relatedTo, relatedId));
    setNewNote('');
    setIsAddingNote(false);
    toast({ title: 'Note added' });
  };

  const handleCompleteActivity = (id: string) => {
    completeActivity(id);
    setActivities(getActivities(relatedTo, relatedId));
    toast({ title: 'Activity completed' });
  };

  // Combine and sort activities and notes by date
  const timeline = [
    ...activities.map((a) => ({ ...a, _type: 'activity' as const })),
    ...notes.map((n) => ({ ...n, _type: 'note' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Activity Timeline</CardTitle>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(!isAddingNote)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Note
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingActivity(!isAddingActivity)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Activity
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Activity Form */}
        {isAddingActivity && (
          <div className="p-4 border border-border rounded-lg space-y-3 animate-fade-in bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={newActivity.type}
                onValueChange={(v) => setNewActivity({ ...newActivity, type: v as ActivityType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="datetime-local"
                value={newActivity.dueDate?.split('.')[0] || ''}
                onChange={(e) => setNewActivity({ ...newActivity, dueDate: e.target.value })}
                placeholder=""
              />
            </div>
            <Input
              value={newActivity.subject || ''}
              onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
              placeholder=""
            />
            <Textarea
              value={newActivity.description || ''}
              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              placeholder=""
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddingActivity(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddActivity}>
                Log Activity
              </Button>
            </div>
          </div>
        )}

        {/* Add Note Form */}
        {isAddingNote && (
          <div className="p-4 border border-border rounded-lg space-y-3 animate-fade-in bg-muted/30">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder=""
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddingNote(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNote}>
                Add Note
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          {timeline.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No activities yet
            </p>
          ) : (
            timeline.map((item) =>
              item._type === 'activity' ? (
                <ActivityTimelineItem
                  key={item.id}
                  activity={item as Activity}
                  onComplete={handleCompleteActivity}
                />
              ) : (
                <NoteItem key={item.id} note={item as Note} />
              )
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
