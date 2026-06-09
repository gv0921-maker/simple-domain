import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Play, Pause, Square, Loader2, Coffee, Briefcase } from 'lucide-react';
import { HR_NAV } from '@/lib/navigation/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import {
  useActiveSession, useDailyAttendance, usePunchIn, usePunchOut, useSchedules,
} from '@/hooks/hr';
import {
  getCurrentPosition, reverseGeocode, validateGeofence, type GeoPoint,
} from '@/lib/services/hr/api';
import { toast } from '@/hooks/use-toast';

const today = () => new Date().toISOString().slice(0, 10);

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDur(min: number | null | undefined) {
  if (!min || min < 0) return '0m';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function ClockIn() {
  const { data: employee, isLoading } = useCurrentEmployee();
  const empId = employee?.id;
  const { data: active } = useActiveSession(empId);
  const { data: daily } = useDailyAttendance(empId, today());
  const { data: schedules = [] } = useSchedules(empId);
  const punchIn = usePunchIn();
  const punchOut = usePunchOut();

  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);

  const todaySchedule = useMemo(() => {
    const dow = new Date().getDay();
    return schedules.find((s) => s.day_of_week === dow) ?? null;
  }, [schedules]);

  const scheduledMinutes = useMemo(() => {
    if (!todaySchedule || !todaySchedule.is_working_day) return 0;
    const [sh, sm] = todaySchedule.start_time.split(':').map(Number);
    const [eh, em] = todaySchedule.end_time.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm) - (todaySchedule.break_duration_minutes ?? 0);
    return Math.max(0, mins);
  }, [todaySchedule]);

  async function capturePoint(): Promise<GeoPoint | null> {
    try {
      const pos = await getCurrentPosition();
      const point: GeoPoint = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy_meters: pos.coords.accuracy,
      };
      const fence = await validateGeofence(point);
      if (!fence.inside) {
        const ok = confirm(
          `You appear to be outside the allowed geofence` +
          (fence.location ? ` (nearest: ${fence.location.name}, ~${Math.round((fence as any).distance ?? 0)}m away)` : '') +
          `. Continue anyway?`
        );
        if (!ok) return null;
      }
      point.address = await reverseGeocode(point.latitude, point.longitude);
      return point;
    } catch (e: any) {
      toast({ title: 'GPS unavailable', description: e?.message ?? 'Permission denied', variant: 'destructive' });
      return null;
    }
  }

  async function handleStart(type: 'work' | 'break') {
    if (!empId) return;
    setBusy(type);
    try {
      const point = await capturePoint();
      if (!point) return;
      await punchIn.mutateAsync({ employee_id: empId, session_type: type, point, notes: notes || null });
      setNotes('');
      toast({ title: type === 'work' ? 'Started work' : 'Started break' });
    } catch (e: any) {
      toast({ title: 'Punch failed', description: e?.message, variant: 'destructive' });
    } finally { setBusy(null); }
  }

  async function handleEnd() {
    if (!active) return;
    setBusy('end');
    try {
      const point = await capturePoint();
      if (!point) return;
      await punchOut.mutateAsync({ session_id: active.id, point, notes: notes || null });
      setNotes('');
      toast({ title: 'Session ended' });
    } catch (e: any) {
      toast({ title: 'Punch failed', description: e?.message, variant: 'destructive' });
    } finally { setBusy(null); }
  }

  if (isLoading) {
    return <AppLayout title="Attendance" moduleNav={HR_NAV}><div className="p-6">Loading…</div></AppLayout>;
  }
  if (!employee) {
    return (
      <AppLayout title="Attendance" moduleNav={HR_NAV}>
        <div className="p-6 max-w-md mx-auto">
          <Card className="p-6">
            <h2 className="font-semibold mb-2">No employee profile linked</h2>
            <p className="text-sm text-muted-foreground">
              Your user account is not linked to any employee record. Ask HR to set <code>user_id</code> on your employee profile.
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const status = !active ? 'off' : active.session_type === 'work' ? 'working' : 'break';
  const liveDur = active ? Math.floor((now - new Date(active.check_in_time).getTime()) / 60_000) : 0;

  return (
    <AppLayout title="Attendance" subtitle="Clock In / Out" moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 max-w-md mx-auto space-y-4">
        <Card className="p-4 flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {employee.profile_photo_url && <AvatarImage src={employee.profile_photo_url} />}
            <AvatarFallback className="bg-primary/10 text-primary">
              {employee.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{employee.full_name}</p>
            <p className="text-xs text-muted-foreground">{employee.designation || employee.employee_code}</p>
          </div>
        </Card>

        <Card className="p-6 text-center space-y-4">
          {status === 'off' && (
            <>
              <Badge variant="outline" className="text-base px-3 py-1">Off</Badge>
              <p className="text-sm text-muted-foreground">You're not clocked in.</p>
              <Button
                size="lg" className="w-full h-16 text-lg gap-2"
                onClick={() => handleStart('work')} disabled={busy !== null}
              >
                {busy === 'work' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                Start Work
              </Button>
            </>
          )}
          {status === 'working' && active && (
            <>
              <Badge className="bg-emerald-100 text-emerald-700 text-base px-3 py-1" variant="outline">
                <Briefcase className="h-3.5 w-3.5 mr-1" /> Working
              </Badge>
              <p className="text-lg font-semibold">since {fmtTime(active.check_in_time)} · {fmtDur(liveDur)}</p>
              <Button
                size="lg" variant="secondary" className="w-full h-14 text-base gap-2"
                onClick={() => handleStart('break')} disabled={busy !== null}
              >
                {busy === 'break' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Coffee className="h-5 w-5" />}
                Start Break
              </Button>
              <Button
                size="sm" variant="outline" className="w-full gap-2"
                onClick={handleEnd} disabled={busy !== null}
              >
                {busy === 'end' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                End Work
              </Button>
            </>
          )}
          {status === 'break' && active && (
            <>
              <Badge className="bg-amber-100 text-amber-700 text-base px-3 py-1" variant="outline">
                <Coffee className="h-3.5 w-3.5 mr-1" /> On break
              </Badge>
              <p className="text-lg font-semibold">since {fmtTime(active.check_in_time)} · {fmtDur(liveDur)}</p>
              <Button
                size="lg" className="w-full h-16 text-lg gap-2"
                onClick={() => handleStart('work')} disabled={busy !== null}
              >
                {busy === 'work' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                Resume Work
              </Button>
            </>
          )}

          <div className="text-left space-y-1">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="" rows={2}
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Today's Timeline</h3>
          {!daily || daily.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet today.</p>
          ) : (
            <ul className="space-y-2">
              {daily.sessions.map((s) => (
                <li key={s.id} className="border rounded-md p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {s.session_type === 'work'
                        ? <Briefcase className="h-4 w-4 text-emerald-600" />
                        : <Coffee className="h-4 w-4 text-amber-600" />}
                      <strong>{s.session_type === 'work' ? 'Work' : 'Break'}</strong>
                      <span className="text-muted-foreground">
                        {fmtTime(s.check_in_time)} → {fmtTime(s.check_out_time)}
                      </span>
                    </span>
                    <span className="text-xs">{fmtDur(s.duration_minutes)}</span>
                  </div>
                  {s.check_in_address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {s.check_in_address}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4 grid grid-cols-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Worked</p>
            <p className="font-semibold">{fmtDur(daily?.totalWorkMinutes ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Break</p>
            <p className="font-semibold">{fmtDur(daily?.totalBreakMinutes ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
            <p className="font-semibold">{fmtDur(scheduledMinutes)}</p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}