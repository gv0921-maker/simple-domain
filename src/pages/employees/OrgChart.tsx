import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EMPLOYEES_NAV } from '@/lib/navigation/employees';
import { useOrgChart } from '@/hooks/hr/employeesExt';
import type { OrgChartNode } from '@/lib/services/hr/employeesExt';

function Node({ node }: { node: OrgChartNode }) {
  return (
    <div className="flex flex-col items-center">
      <Card className="p-3 w-48 text-center">
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-12 w-12">
            {node.photo_url && <AvatarImage src={node.photo_url} />}
            <AvatarFallback>{node.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-tight">{node.name}</p>
            <p className="text-xs text-muted-foreground">{node.designation ?? '—'}</p>
          </div>
        </div>
      </Card>
      {node.children.length > 0 && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-4 pt-4 border-t border-border relative">
            {node.children.map((c) => (
              <div key={c.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-border -mt-4" />
                <Node node={c} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const { data: roots = [], isLoading } = useOrgChart();

  return (
    <AppLayout title="Employees" subtitle="Org Chart" moduleNav={EMPLOYEES_NAV}>
      <div className="p-4 md:p-6 overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : roots.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No reporting structure yet.</Card>
        ) : (
          <div className="flex gap-8 min-w-max p-4">
            {roots.map((r) => <Node key={r.id} node={r} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}