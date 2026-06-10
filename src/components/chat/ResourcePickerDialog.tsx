import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useSendMessageWithResource } from '@/hooks/chat';
import { useToast } from '@/hooks/use-toast';
import type { ResourceType } from '@/lib/services/chat/api';

interface Item { id: string; label: string; subtitle?: string }

const TABS: { type: ResourceType; label: string }[] = [
  { type: 'sales_order', label: 'Orders' },
  { type: 'quotation', label: 'Quotations' },
  { type: 'invoice', label: 'Invoices' },
  { type: 'customer', label: 'Customers' },
  { type: 'product', label: 'Products' },
  { type: 'work_order', label: 'Work Orders' },
  { type: 'employee', label: 'Employees' },
];

async function search(type: ResourceType, q: string): Promise<Item[]> {
  const like = `%${q}%`;
  switch (type) {
    case 'sales_order': {
      const { data } = await supabase.from('sales_orders').select('id, reference, customer_name').ilike('reference', like).limit(50);
      return (data ?? []).map((d) => ({ id: d.id, label: d.reference ?? d.id.slice(0,8), subtitle: d.customer_name ?? undefined }));
    }
    case 'quotation': {
      const { data } = await supabase.from('quotations').select('id, reference, customer_name').ilike('reference', like).limit(50);
      return (data ?? []).map((d) => ({ id: d.id, label: d.reference ?? d.id.slice(0,8), subtitle: d.customer_name ?? undefined }));
    }
    case 'invoice': {
      const { data } = await supabase.from('invoices').select('id, reference, status').ilike('reference', like).limit(50);
      return (data ?? []).map((d) => ({ id: d.id, label: d.reference ?? d.id.slice(0,8), subtitle: d.status ?? undefined }));
    }
    case 'customer': {
      const { data } = await supabase.from('customers').select('id, name, email').ilike('name', like).limit(50);
      return (data ?? []).map((d) => ({ id: d.id, label: d.name, subtitle: d.email ?? undefined }));
    }
    case 'product': {
      const { data } = await supabase.from('products').select('id, name, sku').ilike('name', like).limit(50);
      return (data ?? []).map((d) => ({ id: d.id, label: d.name, subtitle: d.sku ?? undefined }));
    }
    case 'work_order': {
      const { data } = await supabase.from('work_orders').select('id, reference, state').ilike('reference', like).limit(50);
      return (data ?? []).map((d) => ({ id: d.id, label: d.reference ?? d.id.slice(0,8), subtitle: d.state ?? undefined }));
    }
    case 'employee': {
      const { data } = await supabase.from('employees').select('id, full_name, display_name, job_title').or(`full_name.ilike.${like},display_name.ilike.${like}`).limit(50);
      return (data ?? []).map((d: any) => ({ id: d.id, label: d.display_name || d.full_name, subtitle: d.job_title ?? undefined }));
    }
    default: return [];
  }
}

export function ResourcePickerDialog({
  open, onOpenChange, channelId, onSent,
}: { open: boolean; onOpenChange: (o: boolean) => void; channelId: string; onSent?: () => void }) {
  const [tab, setTab] = useState<ResourceType>('sales_order');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<Item | null>(null);
  const [note, setNote] = useState('');
  const send = useSendMessageWithResource();
  const { toast } = useToast();

  useEffect(() => { const t = setTimeout(() => setDebounced(q), 200); return () => clearTimeout(t); }, [q]);
  useEffect(() => { if (!open) { setSelected(null); setNote(''); setQ(''); } }, [open]);

  const { data: items = [], isFetching } = useQuery({
    queryKey: ['resource-search', tab, debounced],
    queryFn: () => search(tab, debounced),
  });

  const handleSend = async () => {
    if (!selected) return;
    try {
      await send.mutateAsync({
        channelId, body: note.trim(),
        resourceType: tab, resourceId: selected.id, resourceLabel: selected.label,
      });
      toast({ title: 'Shared' });
      onOpenChange(false);
      onSent?.();
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)]">
        <DialogHeader><DialogTitle>Share a resource</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={(v) => { setTab(v as ResourceType); setSelected(null); }}>
          <TabsList className="flex flex-wrap h-auto">
            {TABS.map((t) => <TabsTrigger key={t.type} value={t.type}>{t.label}</TabsTrigger>)}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t.type} value={t.type} className="space-y-2">
              <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
              <ScrollArea className="h-60 border rounded-md">
                {isFetching && <div className="p-3 text-sm text-muted-foreground">Searching…</div>}
                {!isFetching && items.length === 0 && <div className="p-3 text-sm text-muted-foreground">No results</div>}
                <ul>
                  {items.map((it) => (
                    <li key={it.id}>
                      <button type="button"
                        onClick={() => setSelected(it)}
                        className={`w-full text-left px-3 py-2 hover:bg-muted text-sm ${selected?.id === it.id ? 'bg-muted' : ''}`}>
                        <div className="font-medium">{it.label}</div>
                        {it.subtitle && <div className="text-xs text-muted-foreground">{it.subtitle}</div>}
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
        {selected && (
          <>
            <Textarea placeholder="Add a note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSend} disabled={send.isPending}>Share</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}