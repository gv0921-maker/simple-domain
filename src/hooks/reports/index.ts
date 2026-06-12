import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SavedReport = {
  id: string;
  report_key: string;
  name: string;
  description: string | null;
  filters_json: Record<string, unknown>;
  columns_json: unknown[];
  sort_by: string | null;
  sort_dir: "asc" | "desc";
  is_shared: boolean;
  shared_with_role: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export function useSavedReports(reportKey?: string) {
  return useQuery({
    queryKey: ["saved_reports", reportKey ?? "all"],
    queryFn: async () => {
      let q = supabase.from("saved_reports").select("*").order("updated_at", { ascending: false });
      if (reportKey) q = q.eq("report_key", reportKey);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as SavedReport[];
    },
  });
}

export function useSaveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { report_key: string; name: string; filters_json: Record<string, unknown> }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("saved_reports").insert([{
        user_id: uid,
        report_key: input.report_key,
        name: input.name,
        filters_json: input.filters_json as never,
      }]).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_reports"] }),
  });
}

export function useScheduleReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { saved_report_id: string; schedule: "daily" | "weekly" | "monthly"; delivery_email: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("scheduled_reports").insert({
        saved_report_id: input.saved_report_id,
        schedule: input.schedule,
        delivery_email: input.delivery_email,
        created_by: uid,
      }).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled_reports"] }),
  });
}

const RECENTS_KEY = "glf_reports_recent";
const FAVS_KEY = "glf_reports_favs";

export function getRecentReports(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]"); } catch { return []; }
}
export function pushRecentReport(key: string) {
  const cur = getRecentReports().filter((k) => k !== key);
  cur.unshift(key);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(cur.slice(0, 10)));
}
export function getFavoriteReports(): string[] {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"); } catch { return []; }
}
export function toggleFavoriteReport(key: string) {
  const cur = getFavoriteReports();
  const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
  localStorage.setItem(FAVS_KEY, JSON.stringify(next));
  return next;
}