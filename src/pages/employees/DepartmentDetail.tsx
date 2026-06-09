import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { HR_NAV } from '@/lib/navigation/hr';
import { useDepartment, useEmployees } from '@/hooks/hr';

export default function DepartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: department, isLoading } = useDepartment(id);
  const { data: employees = [] } = useEmployees();

  const members = useMemo(
    () => employees.filter((e) => e.department_id === id),
    [employees, id]
  );

  if (isLoading) return <AppLayout title="Departments" moduleNav={HR_NAV}><div className="p-6">Loading…</div></AppLayout>;
  if (!department) return <AppLayout title="Departments" moduleNav={HR_NAV}><div className="p-6">Not found.</div></AppLayout>;

  return (
    <AppLayout title="Departments" subtitle={department.name} moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/employees/departments')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Departments
        </Button>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-md" style={{ background: department.color }} />
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{department.name}</h1>
              <p className="text-xs text-muted-foreground">{department.code}</p>
            </div>
            <Badge variant="outline">{members.length} employees</Badge>
          </div>
          {department.description && (
            <p className="mt-3 text-sm text-muted-foreground">{department.description}</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Employees</h2>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees in this department.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {members.map((e) => (
                <div
                  key={e.id}
                  className="p-4 border rounded-md text-center cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/employees/${e.id}`)}
                >
                  <Avatar className="h-14 w-14 mx-auto mb-2">
                    {e.profile_photo_url && <AvatarImage src={e.profile_photo_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {e.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{e.full_name}</p>
                  <p className="text-xs text-muted-foreground">{e.designation || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}