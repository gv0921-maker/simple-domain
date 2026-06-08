import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FormHeader } from '@/components/forms/FormHeader';
import { WorkflowStatus, WorkflowStep } from '@/components/forms/WorkflowStatus';
import { ActivityTimeline } from '@/components/forms/ActivityTimeline';
import { DetailField, DetailGrid } from '@/components/forms/DetailField';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Send,
  StickyNote,
  Calendar,
  Plus,
  Trash2,
  Settings2,
  Barcode,
  ListFilter,
} from 'lucide-react';
import { useTransfer, useSaveTransfer } from '@/hooks/inventory';
import type { InventoryTransfer, TransferStatus } from '@/lib/services/inventory';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

function getWorkflowSteps(status: TransferStatus): WorkflowStep[] {
  const statuses: TransferStatus[] = ['draft', 'waiting', 'ready', 'done'];
  const currentIndex = statuses.indexOf(status);

  return [
    { id: 'draft', label: 'Draft', status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'current' : 'upcoming' },
    { id: 'waiting', label: 'Waiting', status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'upcoming' },
    { id: 'ready', label: 'Ready', status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'upcoming' },
    { id: 'done', label: 'Done', status: currentIndex === 3 ? 'current' : 'upcoming' },
  ];
}

export default function TransferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: loadedTransfer, isLoading } = useTransfer(id);
  const saveMut = useSaveTransfer();
  const transfer = loadedTransfer ?? null;

  if (!transfer) {
    return (
      <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    if (!user) return;
    if (!transfer) return;
    const updated: InventoryTransfer = {
      ...transfer,
      status: newStatus as TransferStatus,
      activities: [
        ...transfer.activities,
        { id: crypto.randomUUID(), userId: user.id, userName: user.name, action: `Status changed to ${newStatus}`, timestamp: new Date().toISOString() },
      ],
    };
    saveMut.mutate(updated, {
      onSuccess: () => toast({ title: 'Status updated', description: `Transfer status changed to ${newStatus}` }),
      onError: (e: any) => toast({ title: 'Update failed', description: e?.message, variant: 'destructive' }),
    });
  };

  const workflowSteps = getWorkflowSteps(transfer.status);

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      {/* Breadcrumb bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <Button variant="outline" size="sm" onClick={() => navigate('/inventory')}>
            New
          </Button>
          <span className="text-primary">Inventory Overview</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-primary">{transfer.operationType}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1">
            <ListFilter className="h-4 w-4" />
            Moves
          </Button>
          <Button variant="ghost" size="sm" className="gap-1">
            <Barcode className="h-4 w-4" />
            Barcode
          </Button>
          <span className="text-sm text-muted-foreground ml-4">1 / 36</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm">Check Availability</Button>
          <Button variant="outline" size="sm">Validate</Button>
          <Button variant="outline" size="sm">Cancel</Button>
        </div>

        <div className="flex items-center gap-4">
          <WorkflowStatus steps={workflowSteps} onStepClick={handleStatusChange} />

          <div className="flex items-center gap-1 ml-4 border-l border-border pl-4">
            <Button size="sm" className="gap-1 bg-accent hover:bg-accent/90">
              <Send className="h-4 w-4" />
              Send message
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <StickyNote className="h-4 w-4" />
              Log note
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Calendar className="h-4 w-4" />
              Activity
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Details */}
        <div className="flex-1 overflow-auto p-6">
          <FormHeader
            title={transfer.reference}
            onToggleFavorite={() => {}}
          />

          <div className="mt-6 space-y-6">
            {/* Key details grid */}
            <DetailGrid columns={2}>
              <DetailField label="Contact" value={`${transfer.contact}${transfer.contactPhone ? `-PH-${transfer.contactPhone}` : ''}`} />
              <DetailField 
                label="Scheduled Date" 
                value={format(parseISO(transfer.scheduledDate), 'dd MMM yyyy, h:mm a')} 
                highlight 
              />
              <DetailField label="Operation Type" value={transfer.operationType} />
              <DetailField 
                label="Product Availability" 
                value={transfer.productAvailability === 'not_available' ? 'Not Available' : transfer.productAvailability} 
                highlight={transfer.productAvailability === 'not_available'}
              />
              <DetailField label="Source Location" value={transfer.sourceLocation} />
              <DetailField label="Source Document" value={transfer.sourceDocument || '-'} isLink />
              <DetailField label="Destination Location" value={transfer.destinationLocation} />
              <DetailField label="Back Order of" value={transfer.backOrderOf || '-'} isLink />
              {transfer.estimateDate && (
                <DetailField 
                  label="Estimate Date" 
                  value={format(parseISO(transfer.estimateDate), 'dd/MM/yyyy hh:mm:ss a')} 
                />
              )}
              <DetailField 
                label="Created by" 
                value={`${transfer.createdBy} ${format(parseISO(transfer.createdAt), 'dd MMM yyyy, h:mm a')}`} 
              />
            </DetailGrid>

            {/* Tabs for Operations, Additional Info, Note */}
            <Tabs defaultValue="operations" className="mt-8">
              <TabsList>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="additional">Additional Info</TabsTrigger>
                <TabsTrigger value="note">Note</TabsTrigger>
              </TabsList>

              <TabsContent value="operations" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Product</TableHead>
                      <TableHead></TableHead>
                      <TableHead className="text-right">Demand</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead></TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfer.moves.map((move, index) => (
                      <TableRow key={index} className="animate-fade-in">
                        <TableCell>
                          <span className="text-info hover:underline cursor-pointer">
                            {move.productName}
                          </span>
                        </TableCell>
                        <TableCell>
                          {!move.available && (
                            <Badge variant="destructive" className="text-xs">
                              Not Available
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{move.demand.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{move.quantity.toFixed(2)}</TableCell>
                        <TableCell>{move.unit}</TableCell>
                        <TableCell>
                          <Button variant="link" size="sm" className="text-info p-0 h-auto">
                            Details
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button variant="link" className="mt-2 text-info gap-1 p-0 h-auto">
                  <Plus className="h-4 w-4" />
                  Add a Product
                </Button>
              </TabsContent>

              <TabsContent value="additional" className="mt-4">
                <div className="text-muted-foreground">Additional information fields...</div>
              </TabsContent>

              <TabsContent value="note" className="mt-4">
                <div className="space-y-2">
                  {transfer.notes.map((note, index) => (
                    <p key={index} className="text-sm text-foreground">{note}</p>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right panel - Activity timeline */}
        <div className="w-80 border-l border-border bg-card overflow-auto p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Activity</h3>
          <ActivityTimeline activities={transfer.activities} />
        </div>
      </div>
    </AppLayout>
  );
}
