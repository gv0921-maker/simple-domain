// CRM Companies List Page
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building,
  Globe,
  Users,
  DollarSign,
  Filter,
} from 'lucide-react';
import { getCompanies, deleteCompany, getContacts, type Company } from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { CompanyFormDialog } from '@/components/crm/CRMFormDialogs';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';

export default function CRMCompaniesList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canCreateContacts, canEditContacts, canDeleteContacts } = useCRMPermissions();
  
  const [companies, setCompanies] = useState<Company[]>(() => getCompanies());
  const [contacts] = useState(() => getContacts());
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();

  const filteredCompanies = useMemo(() => {
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.industry?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }, [companies, search]);

  const getContactCount = (companyId: string) => {
    return contacts.filter((c) => c.companyId === companyId).length;
  };

  const stats = useMemo(() => ({
    total: companies.length,
    active: companies.filter((c) => c.status === 'active').length,
    totalRevenue: companies.reduce((sum, c) => sum + (c.annualRevenue || 0), 0),
    industries: new Set(companies.map((c) => c.industry).filter(Boolean)).size,
  }), [companies]);

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCompany(id);
    setCompanies(getCompanies());
    toast({ title: 'Company deleted' });
  };

  const handleSave = () => {
    setCompanies(getCompanies());
    setEditingCompany(undefined);
  };

  const handleNewCompany = () => {
    setEditingCompany(undefined);
    setIsFormOpen(true);
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Companies</h1>
            <p className="text-muted-foreground">Manage your company accounts and organizations</p>
          </div>
          {canCreateContacts && (
            <Button onClick={handleNewCompany}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.totalRevenue / 1000000).toFixed(1)}M</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Industries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.industries}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <Card className="animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Annual Revenue</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company, index) => (
                  <TableRow
                    key={company.id}
                    className="animate-fade-in cursor-pointer hover:bg-muted/50"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => navigate(`/crm/companies/${company.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          {company.website && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              {company.website.replace(/^https?:\/\//, '')}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.industry && (
                        <Badge variant="secondary" className="text-xs">
                          {company.industry}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.employeeCount && (
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {company.employeeCount}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.annualRevenue ? (
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {company.annualRevenue >= 1000000
                            ? `${(company.annualRevenue / 1000000).toFixed(1)}M`
                            : `${(company.annualRevenue / 1000).toFixed(0)}K`}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getContactCount(company.id)} contacts
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {company.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditContacts && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(company); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteContacts && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleDelete(company.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Dialog */}
        <CompanyFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          company={editingCompany}
          onSave={handleSave}
        />
      </div>
    </AppLayout>
  );
}
