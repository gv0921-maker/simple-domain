import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useDirectory } from '@/hooks/chat';
import { useAuth } from '@/contexts/AuthContext';

const MENTION_RE = /@([A-Za-z0-9._-]+(?:\s[A-Za-z0-9._-]+)?)/g;

export function MessageBody({ body, onMention }: { body: string; onMention?: (mineMentioned: boolean) => void }) {
  const { data: directory = [] } = useDirectory();
  const { user } = useAuth();
  const dirByName = useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    directory.forEach((d) => m.set(d.name.toLowerCase(), { id: d.user_id, name: d.name }));
    return m;
  }, [directory]);

  const parts = useMemo(() => {
    const segs: Array<{ type: 'text' | 'mention'; text: string; mine?: boolean }> = [];
    let lastIdx = 0;
    let mineHit = false;
    let m: RegExpExecArray | null;
    const re = new RegExp(MENTION_RE.source, 'g');
    while ((m = re.exec(body))) {
      const candidate = m[1].toLowerCase();
      let hit: { id: string; name: string } | undefined;
      for (const [k, v] of dirByName.entries()) {
        if (k.startsWith(candidate) || candidate.startsWith(k.split(' ')[0])) { hit = v; break; }
      }
      if (!hit) continue;
      if (m.index > lastIdx) segs.push({ type: 'text', text: body.slice(lastIdx, m.index) });
      const mine = hit.id === user?.id;
      if (mine) mineHit = true;
      segs.push({ type: 'mention', text: hit.name, mine });
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < body.length) segs.push({ type: 'text', text: body.slice(lastIdx) });
    if (segs.length === 0) segs.push({ type: 'text', text: body });
    onMention?.(mineHit);
    return segs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, dirByName, user?.id]);

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((p, i) =>
        p.type === 'text' ? (
          <span key={i}>{p.text}</span>
        ) : (
          <span
            key={i}
            className={cn(
              'inline-block rounded px-1 py-0.5 mx-0.5 text-xs font-medium',
              p.mine ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
            )}
          >
            @{p.text}
          </span>
        ),
      )}
    </span>
  );
}

export function bodyMentionsMe(body: string, myName?: string): boolean {
  if (!myName) return false;
  const first = myName.split(' ')[0].toLowerCase();
  return body.toLowerCase().includes('@' + first);
}