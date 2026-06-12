import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { ReportShell } from "@/components/reports/ReportShell";
import { getReport } from "@/lib/reports/registry";
import { pushRecentReport, useSaveReport, useScheduleReport, useSavedReports } from "@/hooks/reports";

export default function ReportPage() {
  const { reportKey = "" } = useParams();
  const navigate = useNavigate();
  const report = getReport(reportKey);
  const [filters, setFilters] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    report?.filters.forEach((f) => {
      if (f.defaultValue !== undefined) initial[f.key] = f.defaultValue;
    });
    return initial;
  });
  const save = useSaveReport();
  const schedule = useScheduleReport();
  const { data: saved = [] } = useSavedReports(reportKey);

  useEffect(() => { if (reportKey) pushRecentReport(reportKey); }, [reportKey]);

  const query = useQuery({
    queryKey: ["report", reportKey, filters],
    queryFn: () => report!.fetch(filters),
    enabled: !!report,
  });

  if (!report) {
    return (
      <AppLayout title="Report" subtitle="Not found">
        <div className="p-6 space-y-3">
          <p className="text-muted-foreground">Report "{reportKey}" not found.</p>
          <Button asChild variant="outline"><Link to="/reports">Back to Reports Hub</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const mostRecentSaved = saved[0];

  return (
    <AppLayout title={report.module} subtitle="Reports">
      <div className="p-3 md:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`${report.modulePath}/reports`)} className="gap-1.5 -ml-2">
          <ChevronLeft className="h-4 w-4" />Back to {report.module} reports
        </Button>
        <ReportShell
          reportKey={report.key}
          title={report.title}
          description={report.description}
          filtersConfig={report.filters}
          columnsConfig={report.columns}
          data={query.data || []}
          loading={query.isLoading}
          filters={filters}
          onFilterChange={setFilters}
          onSaveFilter={async (name) => { await save.mutateAsync({ report_key: report.key, name, filters_json: filters }); }}
          onSchedule={async ({ schedule: s, email }) => {
            if (!mostRecentSaved) {
              const created = await save.mutateAsync({ report_key: report.key, name: `${report.title} schedule`, filters_json: filters });
              await schedule.mutateAsync({ saved_report_id: (created as any).id, schedule: s, delivery_email: email });
            } else {
              await schedule.mutateAsync({ saved_report_id: mostRecentSaved.id, schedule: s, delivery_email: email });
            }
          }}
        />
      </div>
    </AppLayout>
  );
}