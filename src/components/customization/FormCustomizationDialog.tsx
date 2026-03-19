import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { FieldConfig } from '@/lib/customization/types';
import { useCustomization } from '@/contexts/CustomizationContext';
import { toast } from 'sonner';

// Default fields per form
const FORM_FIELDS: Record<string, FieldConfig[]> = {
  'crm:New Opportunity': [
    { id: 'name', label: 'Opportunity Name', required: true, visible: true, order: 0 },
    { id: 'contact', label: 'Contact', required: false, visible: true, order: 1 },
    { id: 'company', label: 'Company', required: false, visible: true, order: 2 },
    { id: 'expectedRevenue', label: 'Expected Revenue', required: false, visible: true, order: 3 },
    { id: 'expectedCloseDate', label: 'Expected Closing', required: false, visible: true, order: 4 },
    { id: 'priority', label: 'Priority', required: false, visible: true, order: 5 },
    { id: 'tags', label: 'Tags', required: false, visible: true, order: 6 },
  ],
  'crm:New Lead': [
    { id: 'name', label: 'Lead Name', required: true, visible: true, order: 0 },
    { id: 'email', label: 'Email', required: false, visible: true, order: 1 },
    { id: 'phone', label: 'Phone', required: false, visible: true, order: 2 },
    { id: 'company', label: 'Company', required: false, visible: true, order: 3 },
    { id: 'source', label: 'Source', required: false, visible: true, order: 4 },
    { id: 'notes', label: 'Notes', required: false, visible: true, order: 5 },
  ],
  'crm:New Contact': [
    { id: 'firstName', label: 'First Name', required: true, visible: true, order: 0 },
    { id: 'lastName', label: 'Last Name', required: true, visible: true, order: 1 },
    { id: 'email', label: 'Email', required: false, visible: true, order: 2 },
    { id: 'phone', label: 'Phone', required: false, visible: true, order: 3 },
    { id: 'company', label: 'Company', required: false, visible: true, order: 4 },
    { id: 'jobTitle', label: 'Job Title', required: false, visible: true, order: 5 },
    { id: 'address', label: 'Address', required: false, visible: true, order: 6 },
  ],
  'crm:New Company': [
    { id: 'name', label: 'Company Name', required: true, visible: true, order: 0 },
    { id: 'industry', label: 'Industry', required: false, visible: true, order: 1 },
    { id: 'website', label: 'Website', required: false, visible: true, order: 2 },
    { id: 'phone', label: 'Phone', required: false, visible: true, order: 3 },
    { id: 'email', label: 'Email', required: false, visible: true, order: 4 },
    { id: 'address', label: 'Address', required: false, visible: true, order: 5 },
  ],
  'sales:Quotation': [
    { id: 'customer', label: 'Customer', required: true, visible: true, order: 0 },
    { id: 'expirationDate', label: 'Expiration Date', required: false, visible: true, order: 1 },
    { id: 'orderLines', label: 'Order Lines', required: true, visible: true, order: 2 },
    { id: 'notes', label: 'Terms & Notes', required: false, visible: true, order: 3 },
    { id: 'paymentTerms', label: 'Payment Terms', required: false, visible: true, order: 4 },
  ],
  'sales:Sales Order': [
    { id: 'customer', label: 'Customer', required: true, visible: true, order: 0 },
    { id: 'orderDate', label: 'Order Date', required: true, visible: true, order: 1 },
    { id: 'orderLines', label: 'Order Lines', required: true, visible: true, order: 2 },
    { id: 'deliveryDate', label: 'Delivery Date', required: false, visible: true, order: 3 },
    { id: 'notes', label: 'Notes', required: false, visible: true, order: 4 },
  ],
  'sales:Customer': [
    { id: 'name', label: 'Customer Name', required: true, visible: true, order: 0 },
    { id: 'email', label: 'Email', required: false, visible: true, order: 1 },
    { id: 'phone', label: 'Phone', required: false, visible: true, order: 2 },
    { id: 'address', label: 'Address', required: false, visible: true, order: 3 },
    { id: 'taxId', label: 'Tax ID', required: false, visible: true, order: 4 },
  ],
  'inventory:Product': [
    { id: 'name', label: 'Product Name', required: true, visible: true, order: 0 },
    { id: 'sku', label: 'SKU / Barcode', required: false, visible: true, order: 1 },
    { id: 'category', label: 'Category', required: false, visible: true, order: 2 },
    { id: 'cost', label: 'Cost', required: false, visible: true, order: 3 },
    { id: 'price', label: 'Sales Price', required: false, visible: true, order: 4 },
    { id: 'weight', label: 'Weight', required: false, visible: true, order: 5 },
    { id: 'description', label: 'Description', required: false, visible: true, order: 6 },
  ],
  'inventory:Transfer': [
    { id: 'sourceWarehouse', label: 'Source Warehouse', required: true, visible: true, order: 0 },
    { id: 'destWarehouse', label: 'Destination Warehouse', required: true, visible: true, order: 1 },
    { id: 'scheduledDate', label: 'Scheduled Date', required: false, visible: true, order: 2 },
    { id: 'products', label: 'Products', required: true, visible: true, order: 3 },
    { id: 'notes', label: 'Notes', required: false, visible: true, order: 4 },
  ],
  'inventory:Inventory Adjustment': [
    { id: 'warehouse', label: 'Warehouse', required: true, visible: true, order: 0 },
    { id: 'product', label: 'Product', required: true, visible: true, order: 1 },
    { id: 'quantity', label: 'New Quantity', required: true, visible: true, order: 2 },
    { id: 'reason', label: 'Reason', required: false, visible: true, order: 3 },
  ],
  'inventory:Warehouse': [
    { id: 'name', label: 'Warehouse Name', required: true, visible: true, order: 0 },
    { id: 'code', label: 'Short Code', required: false, visible: true, order: 1 },
    { id: 'address', label: 'Address', required: false, visible: true, order: 2 },
    { id: 'manager', label: 'Manager', required: false, visible: true, order: 3 },
  ],
  'manufacturing:Work Order': [
    { id: 'product', label: 'Product', required: true, visible: true, order: 0 },
    { id: 'bom', label: 'Bill of Materials', required: true, visible: true, order: 1 },
    { id: 'quantity', label: 'Quantity', required: true, visible: true, order: 2 },
    { id: 'startDate', label: 'Start Date', required: false, visible: true, order: 3 },
    { id: 'deadline', label: 'Deadline', required: false, visible: true, order: 4 },
    { id: 'workCenter', label: 'Work Center', required: false, visible: true, order: 5 },
  ],
  'manufacturing:Bill of Materials': [
    { id: 'product', label: 'Product', required: true, visible: true, order: 0 },
    { id: 'quantity', label: 'Quantity', required: true, visible: true, order: 1 },
    { id: 'components', label: 'Components', required: true, visible: true, order: 2 },
    { id: 'operations', label: 'Operations', required: false, visible: true, order: 3 },
  ],
  'manufacturing:Work Center': [
    { id: 'name', label: 'Work Center Name', required: true, visible: true, order: 0 },
    { id: 'code', label: 'Code', required: false, visible: true, order: 1 },
    { id: 'capacity', label: 'Capacity', required: false, visible: true, order: 2 },
    { id: 'costPerHour', label: 'Cost per Hour', required: false, visible: true, order: 3 },
  ],
  'accounting:Invoice': [
    { id: 'customer', label: 'Customer', required: true, visible: true, order: 0 },
    { id: 'invoiceDate', label: 'Invoice Date', required: true, visible: true, order: 1 },
    { id: 'dueDate', label: 'Due Date', required: false, visible: true, order: 2 },
    { id: 'lines', label: 'Invoice Lines', required: true, visible: true, order: 3 },
    { id: 'notes', label: 'Notes', required: false, visible: true, order: 4 },
  ],
  'accounting:Payment': [
    { id: 'partner', label: 'Partner', required: true, visible: true, order: 0 },
    { id: 'amount', label: 'Amount', required: true, visible: true, order: 1 },
    { id: 'date', label: 'Payment Date', required: true, visible: true, order: 2 },
    { id: 'method', label: 'Payment Method', required: false, visible: true, order: 3 },
    { id: 'reference', label: 'Reference', required: false, visible: true, order: 4 },
  ],
  'accounting:Journal Entry': [
    { id: 'date', label: 'Date', required: true, visible: true, order: 0 },
    { id: 'journal', label: 'Journal', required: true, visible: true, order: 1 },
    { id: 'reference', label: 'Reference', required: false, visible: true, order: 2 },
    { id: 'lines', label: 'Journal Items', required: true, visible: true, order: 3 },
  ],
};

interface FormCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  formName: string;
}

export function FormCustomizationDialog({
  open,
  onOpenChange,
  moduleId,
  formName,
}: FormCustomizationDialogProps) {
  const { getFormConfig, updateForm } = useCustomization();
  const formKey = `${moduleId}:${formName}`;
  const defaultFields = FORM_FIELDS[formKey] || [];
  
  const [fields, setFields] = useState<FieldConfig[]>([]);

  useEffect(() => {
    if (open) {
      const existing = getFormConfig(moduleId, formName);
      if (existing && existing.fields.length > 0) {
        setFields(existing.fields);
      } else {
        setFields(defaultFields.map(f => ({ ...f })));
      }
    }
  }, [open, moduleId, formName]);

  const toggleVisibility = (fieldId: string) => {
    setFields(prev =>
      prev.map(f => f.id === fieldId && !f.required ? { ...f, visible: !f.visible } : f)
    );
  };

  const updateLabel = (fieldId: string, label: string) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, label } : f));
  };

  const toggleRequired = (fieldId: string) => {
    setFields(prev =>
      prev.map(f => f.id === fieldId ? { ...f, required: !f.required, visible: !f.required ? true : f.visible } : f)
    );
  };

  const handleSave = () => {
    const formId = `${moduleId}:${formName}`;
    updateForm(formId, {
      id: formId,
      moduleId,
      formName,
      fields,
    });
    toast.success(`${formName} form customization saved`);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFields(defaultFields.map(f => ({ ...f })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize: {formName}</DialogTitle>
          <DialogDescription>
            Toggle field visibility, edit labels, and mark fields as required
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          {fields.sort((a, b) => a.order - b.order).map((field) => (
            <div
              key={field.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md border transition-colors ${
                field.visible
                  ? 'bg-card border-border'
                  : 'bg-muted/50 border-border/50 opacity-60'
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
              
              <div className="flex-1 min-w-0">
                <Input
                  value={field.label}
                  onChange={(e) => updateLabel(field.id, e.target.value)}
                  className="h-7 text-sm border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground">Required</Label>
                  <Switch
                    checked={field.required}
                    onCheckedChange={() => toggleRequired(field.id)}
                    className="scale-75"
                  />
                </div>

                <button
                  onClick={() => toggleVisibility(field.id)}
                  disabled={field.required}
                  className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                  title={field.required ? 'Required fields cannot be hidden' : field.visible ? 'Hide field' : 'Show field'}
                >
                  {field.visible ? (
                    <Eye className="h-4 w-4 text-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No configurable fields for this form
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
