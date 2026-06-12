import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchActivityLog, addManualNote, softDeleteLogEntry,
  type ActivityRecordType,
} from '@/lib/services/activityLog';

export const activityLogKeys = {
  all: ['activity-log'] as const,
  record: (t: string, id: string, limit: number) =>
    ['activity-log', t, id, limit] as const,
};

export function useActivityLog(
  recordType: ActivityRecordType | undefined,
  recordId: string | undefined,
  limit = 20,
) {
  return useQuery({
    queryKey: activityLogKeys.record(recordType ?? '', recordId ?? '', limit),
    queryFn: () => fetchActivityLog(recordType!, recordId!, limit, 0),
    enabled: !!recordType && !!recordId,
  });
}

export function useAddManualNote(
  recordType: ActivityRecordType, recordId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => addManualNote(recordType, recordId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-log', recordType, recordId] });
    },
  });
}

export function useSoftDeleteLogEntry(
  recordType: ActivityRecordType, recordId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => softDeleteLogEntry(logId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-log', recordType, recordId] });
    },
  });
}