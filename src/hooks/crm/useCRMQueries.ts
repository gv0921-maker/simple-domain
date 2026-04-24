// React Query hooks for the Supabase-backed CRM data layer.
// Components should consume these instead of calling crm-supabase directly.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import * as crm from '@/lib/data/crm-supabase';
import type {
  Activity,
  CRMTag,
  Company,
  Contact,
  Note,
  Opportunity,
  OpportunityStage,
  Pipeline,
} from '@/lib/services/crm';

// ---------- query keys ----------

export const crmKeys = {
  all: ['crm'] as const,
  contacts: () => [...crmKeys.all, 'contacts'] as const,
  contact: (id: string) => [...crmKeys.contacts(), id] as const,
  companies: () => [...crmKeys.all, 'companies'] as const,
  company: (id: string) => [...crmKeys.companies(), id] as const,
  opportunities: () => [...crmKeys.all, 'opportunities'] as const,
  opportunity: (id: string) => [...crmKeys.opportunities(), id] as const,
  pipelines: () => [...crmKeys.all, 'pipelines'] as const,
  activities: (relatedTo?: string, relatedId?: string) =>
    [...crmKeys.all, 'activities', relatedTo ?? null, relatedId ?? null] as const,
  notes: (relatedTo?: string, relatedId?: string) =>
    [...crmKeys.all, 'notes', relatedTo ?? null, relatedId ?? null] as const,
  tags: () => [...crmKeys.all, 'tags'] as const,
  stats: () => [...crmKeys.all, 'stats'] as const,
  oppsByStage: () => [...crmKeys.all, 'opps-by-stage'] as const,
};

// ---------- contacts ----------

export function useContacts(opts?: Partial<UseQueryOptions<Contact[]>>) {
  return useQuery({
    queryKey: crmKeys.contacts(),
    queryFn: () => crm.getContacts(),
    ...opts,
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: crmKeys.contact(id ?? ''),
    queryFn: () => (id ? crm.getContact(id) : Promise.resolve(undefined)),
    enabled: !!id,
  });
}

export function useSaveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Partial<Contact> & { id?: string }) => crm.saveContact(c),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: crmKeys.contacts() });
      qc.setQueryData(crmKeys.contact(saved.id), saved);
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crm.deleteContact(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.contacts() }),
  });
}

// ---------- companies ----------

export function useCompanies() {
  return useQuery({ queryKey: crmKeys.companies(), queryFn: () => crm.getCompanies() });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: crmKeys.company(id ?? ''),
    queryFn: () => (id ? crm.getCompany(id) : Promise.resolve(undefined)),
    enabled: !!id,
  });
}

export function useSaveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Partial<Company> & { id?: string }) => crm.saveCompany(c),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: crmKeys.companies() });
      qc.setQueryData(crmKeys.company(saved.id), saved);
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crm.deleteCompany(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.companies() }),
  });
}

// ---------- pipelines ----------

export function usePipelines() {
  return useQuery({ queryKey: crmKeys.pipelines(), queryFn: () => crm.getPipelines() });
}

export function useDefaultPipeline() {
  const { data: pipelines, ...rest } = usePipelines();
  const def = pipelines?.find((p) => p.isDefault) || pipelines?.[0];
  return { ...rest, data: def, pipelines };
}

export function useSavePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<Pipeline> & { id?: string }) => crm.savePipeline(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.pipelines() }),
  });
}

export function useDeletePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crm.deletePipeline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crmKeys.pipelines() });
      qc.invalidateQueries({ queryKey: crmKeys.opportunities() });
    },
  });
}

export function useSetDefaultPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crm.setDefaultPipeline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.pipelines() }),
  });
}

// ---------- opportunities ----------

export function useOpportunities() {
  return useQuery({ queryKey: crmKeys.opportunities(), queryFn: () => crm.getOpportunities() });
}

export function useOpportunity(id: string | undefined) {
  return useQuery({
    queryKey: crmKeys.opportunity(id ?? ''),
    queryFn: () => (id ? crm.getOpportunity(id) : Promise.resolve(undefined)),
    enabled: !!id,
  });
}

export function useSaveOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (o: Partial<Opportunity> & { id?: string }) => crm.saveOpportunity(o),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: crmKeys.opportunities() });
      qc.setQueryData(crmKeys.opportunity(saved.id), saved);
      qc.invalidateQueries({ queryKey: crmKeys.stats() });
      qc.invalidateQueries({ queryKey: crmKeys.oppsByStage() });
    },
  });
}

export function useUpdateOpportunityStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; stageId: string; stage: OpportunityStage }) =>
      crm.updateOpportunityStage(vars.id, vars.stageId, vars.stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crmKeys.opportunities() });
      qc.invalidateQueries({ queryKey: crmKeys.stats() });
      qc.invalidateQueries({ queryKey: crmKeys.oppsByStage() });
    },
  });
}

export function useDeleteOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crm.deleteOpportunity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crmKeys.opportunities() });
      qc.invalidateQueries({ queryKey: crmKeys.stats() });
    },
  });
}

// ---------- activities ----------

export function useActivities(relatedTo?: string, relatedId?: string) {
  return useQuery({
    queryKey: crmKeys.activities(relatedTo, relatedId),
    queryFn: () => crm.getActivities(relatedTo, relatedId),
  });
}

export function useSaveActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: Partial<Activity> & { id?: string }) => crm.saveActivity(a),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...crmKeys.all, 'activities'] }),
  });
}

export function useCompleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crm.completeActivity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...crmKeys.all, 'activities'] }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crm.deleteActivity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...crmKeys.all, 'activities'] }),
  });
}

// Realtime subscription for activities of a single record
export function useActivitiesRealtime(relatedId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!relatedId) return;
    return crm.subscribeToActivities(relatedId, () => {
      qc.invalidateQueries({ queryKey: [...crmKeys.all, 'activities'] });
    });
  }, [relatedId, qc]);
}

// ---------- notes ----------

export function useNotes(relatedTo?: string, relatedId?: string) {
  return useQuery({
    queryKey: crmKeys.notes(relatedTo, relatedId),
    queryFn: () => crm.getNotes(relatedTo, relatedId),
  });
}

export function useSaveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (n: Partial<Note> & { id?: string }) => crm.saveNote(n),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...crmKeys.all, 'notes'] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crm.deleteNote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...crmKeys.all, 'notes'] }),
  });
}

export function useNotesRealtime(relatedId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!relatedId) return;
    return crm.subscribeToNotes(relatedId, () => {
      qc.invalidateQueries({ queryKey: [...crmKeys.all, 'notes'] });
    });
  }, [relatedId, qc]);
}

// ---------- tags ----------

export function useTags() {
  return useQuery({ queryKey: crmKeys.tags(), queryFn: () => crm.getTags() });
}

export function useSaveTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: Partial<CRMTag>) => crm.saveTag(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.tags() }),
  });
}

// ---------- analytics ----------

export function useCRMStats() {
  return useQuery({ queryKey: crmKeys.stats(), queryFn: () => crm.getCRMStats() });
}

export function useOpportunitiesByStage() {
  return useQuery({ queryKey: crmKeys.oppsByStage(), queryFn: () => crm.getOpportunitiesByStage() });
}

// ---------- import / export ----------

export function useImportContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: Partial<Contact>[]) => crm.importContacts(records),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crmKeys.contacts() });
      qc.invalidateQueries({ queryKey: crmKeys.stats() });
    },
  });
}

export function useImportOpportunities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: Partial<Opportunity>[]) => crm.importOpportunities(records),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crmKeys.opportunities() });
      qc.invalidateQueries({ queryKey: crmKeys.stats() });
      qc.invalidateQueries({ queryKey: crmKeys.oppsByStage() });
    },
  });
}

export function useExportContacts() {
  return useMutation({
    mutationFn: () => crm.exportContacts(),
  });
}

export function useExportOpportunities() {
  return useMutation({
    mutationFn: () => crm.exportOpportunities(),
  });
}