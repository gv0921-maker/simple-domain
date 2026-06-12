import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileBarChart } from "lucide-react";
import { getReportsByModulePath } from "@/lib/reports/registry";

export function ModuleReportsLanding({ modulePath, moduleTitle, moduleNav }: { modulePath: string; moduleTitle: string; moduleNav?: { label: string; href: string }[] }) {
  const reports = getReportsByModulePath(modulePath);
  return (
    <AppLayout title={moduleTitle} subtitle="Reports" moduleNav={moduleNav}>
      <div className="p-3 md:p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{moduleTitle} Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Predefined reports with filters, drill-down, and CSV/Excel/PDF export.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => (
            <Link key={r.key} to={`${modulePath}/reports/${r.key}`}>
              <Card className="h-full hover:bg-accent/40 transition-colors">
                <CardContent className="p-4 flex gap-3 items-start">
                  <div className="rounded-md bg-primary/10 text-primary p-2 shrink-0"><FileBarChart className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium truncate">{r.title}</h3>
                      {r.roles && r.roles.length > 0 && (
                        <Badge variant="outline" className="shrink-0 text-[10px]">role-gated</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {reports.length === 0 && (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No reports available in this module yet.</CardContent></Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default ModuleReportsLanding;