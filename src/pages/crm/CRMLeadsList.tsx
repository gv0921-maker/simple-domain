import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Search } from 'lucide-react';
import { CRM_NAV } from '@/lib/navigation/crm';
import { getLeads, deleteLead, type Lead, type LeadStatus, type LeadSource } from '@/lib/data/crm';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-info/10 text-info',
  contacted: 'bg-warning/10 text-warning',
  qualified: 'bg-success/10 text-success',
  unqualified: 'bg-muted text-muted-foreground',
  converted: 'bg-primary/10 text-primary',
  lost: 'bg-destructive/10 text-destructive',
};

export default function CRMLeadsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canCreateLeads, canDeleteLeads, filterByScope } = useCRMPermissions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allLeads = useMemo(() => filterByScope(getLeads()), []);
  const filtered = useMemo(() => {
    let list = allLeads;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l => l.title.toLowerCase().includes(q) || l.contactName.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter(l => l.status === statusFilter);
    if (sourceFilter !== 'all') list = list.filter(l => l.source === sourceFilter);
    return list;
  }, [allLeads, search, statusFilter, sourceFilter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleBulkDelete = () => {
    selected.forEach(id => deleteLead(id));
    toast({ title: `${selected.size} lead(s) deleted` });
    setSelected(new Set());
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {canCreateLeads && (
            <Button size="sm" onClick={() => navigate('/crm/leads/new')}>
              <Plus className="h-4 w-4 mr-1" /> New Lead
            </Button>
          )}
          {selected.size > 0 && canDeleteLeads && (
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete ({selected.size})
            </Button>
          )}
          <div className="flex-1" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="trade_show">Trade Show</SelectItem>
              <SelectItem value="cold_call">Cold Call</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-56 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Lead</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>
              ) : filtered.map(lead => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/crm/leads/${lead.id}`)}
                >
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selected.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{lead.title}</TableCell>
                  <TableCell>{lead.contactName}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize text-xs">{lead.source.replace('_', ' ')}</Badge></TableCell>
                  <TableCell><Badge className={`${STATUS_COLORS[lead.status]} text-xs capitalize`}>{lead.status}</Badge></TableCell>
                  <TableCell className="text-right font-mono text-sm">{lead.score}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(parseISO(lead.createdAt), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}