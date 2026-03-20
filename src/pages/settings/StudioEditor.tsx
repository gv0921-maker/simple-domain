// Odoo Studio-style Form Editor
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Save, RotateCcw, Plus, Trash2, Eye, EyeOff,
  GripVertical, Settings2, Puzzle, MousePointerClick, LayoutGrid,
  FileText, ShoppingCart, Package, DollarSign, Users, Truck,
  Factory, Target, Mail, Phone, Calendar, ClipboardList, Building,
  Globe, Star, Heart, MessageSquare, Bell, Flag, Tag, Bookmark,
  Columns, PanelLeft, Type, Hash, AtSign, Link as LinkIcon,
  CheckSquare, AlignLeft, Image, Zap, Lock, Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  StudioFormConfig, StudioField, StudioSmartButton, StudioActionButton,
  StudioSection, StudioTab, FieldWidgetType, WIDGET_OPTIONS, MODULE_REGISTRY,
  SMART_BUTTON_ICONS,
} from '@/lib/customization/studioTypes';
import { getStudioForm, saveStudioForm, resetStudioForm } from '@/lib/customization/studioStorage';

// Icon lookup
const ICON_MAP: Record<string, React.ElementType> = {
  FileText, ShoppingCart, Package, DollarSign, Users, Mail, Phone,
  Calendar, ClipboardList, Truck, Factory, Building, Globe, Star,
  Heart, MessageSquare, Bell, Flag, Tag, Bookmark, Target,
};

const WIDGET_ICON_MAP: Record<FieldWidgetType, React.ElementType> = {
  text: Type, number: Hash, email: AtSign, phone: Phone, date: Calendar,
  datetime: Calendar, select: PanelLeft, multiselect: PanelLeft,
  checkbox: CheckSquare, textarea: AlignLeft, currency: DollarSign,
  url: LinkIcon, tags: Tag, priority: Star, status: Zap, color: Zap, image: Image,
};

export default function StudioEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const moduleId = searchParams.get('module') || '';
  const formName = searchParams.get('form') || '';

  const [config, setConfig] = useState<StudioFormConfig | null>(null);
  const [selectedElement, setSelectedElement] = useState<{ type: 'field' | 'smartButton' | 'actionButton' | 'section' | 'tab'; id: string } | null>(null);
  const [activePanel, setActivePanel] = useState<'properties' | 'add'>('properties');
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [addSmartButtonDialogOpen, setAddSmartButtonDialogOpen] = useState(false);
  const [addActionButtonDialogOpen, setAddActionButtonDialogOpen] = useState(false);
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
  const [addTabDialogOpen, setAddTabDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (moduleId && formName) {
      setConfig(getStudioForm(moduleId, formName));
    }
  }, [moduleId, formName]);

  const updateConfig = useCallback((updater: (prev: StudioFormConfig) => StudioFormConfig) => {
    setConfig(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      setHasChanges(true);
      return next;
    });
  }, []);

  const handleSave = () => {
    if (config) {
      saveStudioForm(config);
      setHasChanges(false);
      toast.success('Form customization saved');
    }
  };

  const handleReset = () => {
    if (moduleId && formName) {
      const defaultConfig = resetStudioForm(moduleId, formName);
      setConfig(defaultConfig);
      setSelectedElement(null);
      setHasChanges(false);
      toast.success('Form reset to defaults');
    }
  };

  if (!config) {
    return (
      <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
        <div className="p-8 text-center text-muted-foreground">
          No form selected. <Button variant="link" onClick={() => navigate('/settings/customization')}>Go back</Button>
        </div>
      </AppLayout>
    );
  }

  const selectedField = selectedElement?.type === 'field' ? config.fields.find(f => f.id === selectedElement.id) : null;
  const selectedSmartButton = selectedElement?.type === 'smartButton' ? config.smartButtons.find(b => b.id === selectedElement.id) : null;
  const selectedActionButton = selectedElement?.type === 'actionButton' ? config.actionButtons.find(b => b.id === selectedElement.id) : null;
  const selectedSection = selectedElement?.type === 'section' ? config.sections.find(s => s.id === selectedElement.id) : null;
  const selectedTab = selectedElement?.type === 'tab' ? config.tabs.find(t => t.id === selectedElement.id) : null;

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Studio Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings/customization')} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">{formName}</h2>
              <p className="text-xs text-muted-foreground capitalize">{moduleId} Module</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && <Badge variant="outline" className="text-xs bg-accent text-accent-foreground">Unsaved changes</Badge>}
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Form Canvas */}
          <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Smart Buttons Row */}
              <div className="flex flex-wrap gap-2 mb-2">
                {config.smartButtons.filter(b => b.visible).map(btn => {
                  const IconComp = ICON_MAP[btn.icon] || FileText;
                  return (
                    <button
                      key={btn.id}
                      onClick={() => setSelectedElement({ type: 'smartButton', id: btn.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${
                        selectedElement?.id === btn.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <IconComp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{btn.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setAddSmartButtonDialogOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Smart Button
                </button>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {config.actionButtons.filter(b => b.visible && b.position === 'header').sort((a, b) => a.order - b.order).map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setSelectedElement({ type: 'actionButton', id: btn.id })}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      selectedElement?.id === btn.id ? 'ring-2 ring-primary/20' : ''
                    } ${
                      btn.type === 'primary' ? 'bg-primary text-primary-foreground'
                        : btn.type === 'danger' ? 'bg-destructive text-destructive-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
                <button
                  onClick={() => setAddActionButtonDialogOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Action
                </button>
              </div>

              {/* Form Sections */}
              {config.sections.sort((a, b) => a.order - b.order).map(section => (
                <div
                  key={section.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement({ type: 'section', id: section.id }); }}
                  className={`bg-card rounded-lg border p-4 transition-all cursor-pointer ${
                    selectedElement?.type === 'section' && selectedElement.id === section.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  } ${!section.visible ? 'opacity-50' : ''}`}
                >
                  {section.label && (
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section.label}</h3>
                  )}
                  <div className={`grid gap-3 ${section.columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {section.fieldIds.map(fieldId => {
                      const field = config.fields.find(f => f.id === fieldId);
                      if (!field || !field.visible) return null;
                      const WidgetIcon = WIDGET_ICON_MAP[field.widget] || Type;
                      return (
                        <div
                          key={field.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedElement({ type: 'field', id: field.id }); }}
                          className={`group relative rounded-md border p-2.5 transition-all cursor-pointer ${
                            field.colSpan === 2 ? 'col-span-2' : ''
                          } ${
                            selectedElement?.type === 'field' && selectedElement.id === field.id
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border/60 hover:border-primary/40 bg-background'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <WidgetIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-foreground">{field.label}</span>
                            {field.required && <span className="text-destructive text-xs">*</span>}
                            {field.readOnly && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          <div className="mt-1.5 ml-7">
                            <div className="h-7 rounded bg-muted/50 border border-border/40 px-2 flex items-center">
                              <span className="text-xs text-muted-foreground">{field.placeholder || field.label}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={(e) => { e.stopPropagation(); setAddFieldDialogOpen(true); }}
                      className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Field
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setAddSectionDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
              >
                <Columns className="h-4 w-4" />
                Add Section
              </button>

              {/* Tabs */}
              {config.tabs.length > 0 && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center border-b border-border">
                    {config.tabs.sort((a, b) => a.order - b.order).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedElement({ type: 'tab', id: tab.id })}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                          selectedElement?.type === 'tab' && selectedElement.id === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        } ${!tab.visible ? 'opacity-40' : ''}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setAddTabDialogOpen(true)}
                      className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-4">
                    {config.tabs.filter(t => t.visible).length > 0 && (
                      <div className="space-y-2">
                        {config.tabs[0]?.fields.map(fieldId => {
                          const field = config.fields.find(f => f.id === fieldId);
                          if (!field) return null;
                          const WidgetIcon = WIDGET_ICON_MAP[field.widget] || Type;
                          return (
                            <div
                              key={field.id}
                              onClick={() => setSelectedElement({ type: 'field', id: field.id })}
                              className={`rounded-md border p-2.5 cursor-pointer transition-all ${
                                selectedElement?.type === 'field' && selectedElement.id === field.id
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                  : 'border-border/60 hover:border-primary/40 bg-background'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <WidgetIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium">{field.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Properties Panel */}
          <div className="w-80 border-l border-border bg-card shrink-0 flex flex-col overflow-hidden">
            <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as typeof activePanel)} className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="m-2 mb-0">
                <TabsTrigger value="properties" className="gap-1.5 text-xs flex-1">
                  <Settings2 className="h-3.5 w-3.5" />
                  Properties
                </TabsTrigger>
                <TabsTrigger value="add" className="gap-1.5 text-xs flex-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-4">
                    {!selectedElement && (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        Click an element on the form to edit its properties
                      </div>
                    )}

                    {/* Field Properties */}
                    {selectedField && (
                      <FieldProperties
                        field={selectedField}
                        onUpdate={(updates) => {
                          updateConfig(prev => ({
                            ...prev,
                            fields: prev.fields.map(f => f.id === selectedField.id ? { ...f, ...updates } : f),
                          }));
                        }}
                        onDelete={() => {
                          updateConfig(prev => ({
                            ...prev,
                            fields: prev.fields.filter(f => f.id !== selectedField.id),
                            sections: prev.sections.map(s => ({ ...s, fieldIds: s.fieldIds.filter(id => id !== selectedField.id) })),
                            tabs: prev.tabs.map(t => ({ ...t, fields: t.fields.filter(id => id !== selectedField.id) })),
                          }));
                          setSelectedElement(null);
                        }}
                      />
                    )}

                    {/* Smart Button Properties */}
                    {selectedSmartButton && (
                      <SmartButtonProperties
                        button={selectedSmartButton}
                        onUpdate={(updates) => {
                          updateConfig(prev => ({
                            ...prev,
                            smartButtons: prev.smartButtons.map(b => b.id === selectedSmartButton.id ? { ...b, ...updates } : b),
                          }));
                        }}
                        onDelete={() => {
                          updateConfig(prev => ({
                            ...prev,
                            smartButtons: prev.smartButtons.filter(b => b.id !== selectedSmartButton.id),
                          }));
                          setSelectedElement(null);
                        }}
                      />
                    )}

                    {/* Action Button Properties */}
                    {selectedActionButton && (
                      <ActionButtonProperties
                        button={selectedActionButton}
                        onUpdate={(updates) => {
                          updateConfig(prev => ({
                            ...prev,
                            actionButtons: prev.actionButtons.map(b => b.id === selectedActionButton.id ? { ...b, ...updates } : b),
                          }));
                        }}
                        onDelete={() => {
                          updateConfig(prev => ({
                            ...prev,
                            actionButtons: prev.actionButtons.filter(b => b.id !== selectedActionButton.id),
                          }));
                          setSelectedElement(null);
                        }}
                      />
                    )}

                    {/* Section Properties */}
                    {selectedSection && (
                      <SectionProperties
                        section={selectedSection}
                        onUpdate={(updates) => {
                          updateConfig(prev => ({
                            ...prev,
                            sections: prev.sections.map(s => s.id === selectedSection.id ? { ...s, ...updates } : s),
                          }));
                        }}
                        onDelete={() => {
                          updateConfig(prev => ({
                            ...prev,
                            sections: prev.sections.filter(s => s.id !== selectedSection.id),
                          }));
                          setSelectedElement(null);
                        }}
                      />
                    )}

                    {/* Tab Properties */}
                    {selectedTab && (
                      <TabProperties
                        tab={selectedTab}
                        onUpdate={(updates) => {
                          updateConfig(prev => ({
                            ...prev,
                            tabs: prev.tabs.map(t => t.id === selectedTab.id ? { ...t, ...updates } : t),
                          }));
                        }}
                        onDelete={() => {
                          updateConfig(prev => ({
                            ...prev,
                            tabs: prev.tabs.filter(t => t.id !== selectedTab.id),
                          }));
                          setSelectedElement(null);
                        }}
                      />
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="add" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Components</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Field', icon: Type, action: () => setAddFieldDialogOpen(true) },
                        { label: 'Section', icon: Columns, action: () => setAddSectionDialogOpen(true) },
                        { label: 'Tab', icon: LayoutGrid, action: () => setAddTabDialogOpen(true) },
                        { label: 'Smart Button', icon: Puzzle, action: () => setAddSmartButtonDialogOpen(true) },
                        { label: 'Action Button', icon: MousePointerClick, action: () => setAddActionButtonDialogOpen(true) },
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
                        >
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <Separator />

                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field Types</p>
                    <div className="space-y-1">
                      {WIDGET_OPTIONS.map(w => {
                        const Icon = WIDGET_ICON_MAP[w.value] || Type;
                        return (
                          <button
                            key={w.value}
                            onClick={() => {
                              const newField: StudioField = {
                                id: `field_${Date.now()}`,
                                label: `New ${w.label}`,
                                technicalName: `new_${w.value}_${Date.now()}`,
                                widget: w.value,
                                required: false,
                                visible: true,
                                readOnly: false,
                                colSpan: 1,
                              };
                              updateConfig(prev => {
                                const firstSection = prev.sections[0];
                                return {
                                  ...prev,
                                  fields: [...prev.fields, newField],
                                  sections: firstSection
                                    ? prev.sections.map((s, i) => i === 0 ? { ...s, fieldIds: [...s.fieldIds, newField.id] } : s)
                                    : prev.sections,
                                };
                              });
                              setSelectedElement({ type: 'field', id: newField.id });
                              setActivePanel('properties');
                              toast.success(`${w.label} field added`);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                          >
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs">{w.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add Field Dialog */}
      <AddFieldDialog
        open={addFieldDialogOpen}
        onOpenChange={setAddFieldDialogOpen}
        onAdd={(field, targetSectionId) => {
          updateConfig(prev => ({
            ...prev,
            fields: [...prev.fields, field],
            sections: prev.sections.map(s => s.id === targetSectionId ? { ...s, fieldIds: [...s.fieldIds, field.id] } : s),
          }));
          setSelectedElement({ type: 'field', id: field.id });
          setActivePanel('properties');
        }}
        sections={config.sections}
      />

      {/* Add Smart Button Dialog */}
      <AddSmartButtonDialog
        open={addSmartButtonDialogOpen}
        onOpenChange={setAddSmartButtonDialogOpen}
        onAdd={(btn) => {
          updateConfig(prev => ({ ...prev, smartButtons: [...prev.smartButtons, btn] }));
          setSelectedElement({ type: 'smartButton', id: btn.id });
          setActivePanel('properties');
        }}
      />

      {/* Add Action Button Dialog */}
      <AddActionButtonDialog
        open={addActionButtonDialogOpen}
        onOpenChange={setAddActionButtonDialogOpen}
        onAdd={(btn) => {
          updateConfig(prev => ({ ...prev, actionButtons: [...prev.actionButtons, btn] }));
          setSelectedElement({ type: 'actionButton', id: btn.id });
          setActivePanel('properties');
        }}
      />

      {/* Add Section Dialog */}
      <AddSectionDialog
        open={addSectionDialogOpen}
        onOpenChange={setAddSectionDialogOpen}
        onAdd={(section) => {
          updateConfig(prev => ({ ...prev, sections: [...prev.sections, section] }));
        }}
        nextOrder={config.sections.length}
      />

      {/* Add Tab Dialog */}
      <AddTabDialog
        open={addTabDialogOpen}
        onOpenChange={setAddTabDialogOpen}
        onAdd={(tab) => {
          updateConfig(prev => ({ ...prev, tabs: [...prev.tabs, tab] }));
        }}
        nextOrder={config.tabs.length}
      />
    </AppLayout>
  );
}

// === Property Panels ===

function FieldProperties({ field, onUpdate, onDelete }: { field: StudioField; onUpdate: (u: Partial<StudioField>) => void; onDelete: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field Properties</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        <div>
          <Label className="text-xs">Label</Label>
          <Input value={field.label} onChange={e => onUpdate({ label: e.target.value })} className="h-7 text-xs mt-1" />
        </div>
        <div>
          <Label className="text-xs">Technical Name</Label>
          <Input value={field.technicalName} onChange={e => onUpdate({ technicalName: e.target.value })} className="h-7 text-xs mt-1 font-mono" />
        </div>
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input value={field.placeholder || ''} onChange={e => onUpdate({ placeholder: e.target.value })} className="h-7 text-xs mt-1" />
        </div>
        <div>
          <Label className="text-xs">Widget</Label>
          <Select value={field.widget} onValueChange={v => onUpdate({ widget: v as FieldWidgetType })}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WIDGET_OPTIONS.map(w => (
                <SelectItem key={w.value} value={w.value} className="text-xs">{w.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Column Span</Label>
          <Select value={String(field.colSpan)} onValueChange={v => onUpdate({ colSpan: Number(v) as 1 | 2 })}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="text-xs">Half Width</SelectItem>
              <SelectItem value="2" className="text-xs">Full Width</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Default Value</Label>
          <Input value={field.defaultValue || ''} onChange={e => onUpdate({ defaultValue: e.target.value })} className="h-7 text-xs mt-1" />
        </div>
        <div>
          <Label className="text-xs">Tooltip</Label>
          <Input value={field.tooltip || ''} onChange={e => onUpdate({ tooltip: e.target.value })} className="h-7 text-xs mt-1" />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Required</Label>
            <Switch checked={field.required} onCheckedChange={v => onUpdate({ required: v, visible: v ? true : field.visible })} className="scale-75" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Visible</Label>
            <Switch checked={field.visible} onCheckedChange={v => onUpdate({ visible: v })} disabled={field.required} className="scale-75" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Read Only</Label>
            <Switch checked={field.readOnly} onCheckedChange={v => onUpdate({ readOnly: v })} className="scale-75" />
          </div>
        </div>

        {(field.widget === 'select' || field.widget === 'multiselect') && (
          <>
            <Separator />
            <div>
              <Label className="text-xs">Options</Label>
              <div className="space-y-1 mt-1">
                {(field.options || []).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <Input
                      value={opt.label}
                      onChange={e => {
                        const newOpts = [...(field.options || [])];
                        newOpts[idx] = { ...newOpts[idx], label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                        onUpdate({ options: newOpts });
                      }}
                      className="h-6 text-xs flex-1"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                      onUpdate({ options: (field.options || []).filter((_, i) => i !== idx) });
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-6 text-xs"
                  onClick={() => onUpdate({ options: [...(field.options || []), { label: 'New Option', value: 'new_option' }] })}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Option
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SmartButtonProperties({ button, onUpdate, onDelete }: { button: StudioSmartButton; onUpdate: (u: Partial<StudioSmartButton>) => void; onDelete: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Smart Button</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-2">
        <div>
          <Label className="text-xs">Label</Label>
          <Input value={button.label} onChange={e => onUpdate({ label: e.target.value })} className="h-7 text-xs mt-1" />
        </div>
        <div>
          <Label className="text-xs">Icon</Label>
          <Select value={button.icon} onValueChange={v => onUpdate({ icon: v })}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SMART_BUTTON_ICONS.map(icon => (
                <SelectItem key={icon} value={icon} className="text-xs">{icon}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Target Module</Label>
          <Select value={button.targetModule} onValueChange={v => onUpdate({ targetModule: v })}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODULE_REGISTRY.map(m => (
                <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Target Route</Label>
          <Select value={button.targetRoute} onValueChange={v => onUpdate({ targetRoute: v })}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODULE_REGISTRY.find(m => m.id === button.targetModule)?.routes.map(r => (
                <SelectItem key={r.path} value={r.path} className="text-xs">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Visible</Label>
          <Switch checked={button.visible} onCheckedChange={v => onUpdate({ visible: v })} className="scale-75" />
        </div>
      </div>
    </div>
  );
}

function ActionButtonProperties({ button, onUpdate, onDelete }: { button: StudioActionButton; onUpdate: (u: Partial<StudioActionButton>) => void; onDelete: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action Button</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-2">
        <div>
          <Label className="text-xs">Label</Label>
          <Input value={button.label} onChange={e => onUpdate({ label: e.target.value })} className="h-7 text-xs mt-1" />
        </div>
        <div>
          <Label className="text-xs">Style</Label>
          <Select value={button.type} onValueChange={v => onUpdate({ type: v as StudioActionButton['type'] })}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="primary" className="text-xs">Primary</SelectItem>
              <SelectItem value="secondary" className="text-xs">Secondary</SelectItem>
              <SelectItem value="danger" className="text-xs">Danger</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Action Type</Label>
          <Select value={button.action} onValueChange={v => onUpdate({ action: v as StudioActionButton['action'] })}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="navigate" className="text-xs">Navigate</SelectItem>
              <SelectItem value="status_change" className="text-xs">Change Status</SelectItem>
              <SelectItem value="print" className="text-xs">Print</SelectItem>
              <SelectItem value="email" className="text-xs">Send Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {button.action === 'navigate' && (
          <div>
            <Label className="text-xs">Target Route</Label>
            <Input value={button.targetRoute || ''} onChange={e => onUpdate({ targetRoute: e.target.value })} className="h-7 text-xs mt-1" placeholder="" />
          </div>
        )}
        {button.action === 'status_change' && (
          <div>
            <Label className="text-xs">Target Status</Label>
            <Input value={button.targetStatus || ''} onChange={e => onUpdate({ targetStatus: e.target.value })} className="h-7 text-xs mt-1" />
          </div>
        )}
        <div>
          <Label className="text-xs">Position</Label>
          <Select value={button.position} onValueChange={v => onUpdate({ position: v as 'header' | 'footer' })}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="header" className="text-xs">Header</SelectItem>
              <SelectItem value="footer" className="text-xs">Footer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Visible</Label>
          <Switch checked={button.visible} onCheckedChange={v => onUpdate({ visible: v })} className="scale-75" />
        </div>
      </div>
    </div>
  );
}

function SectionProperties({ section, onUpdate, onDelete }: { section: StudioSection; onUpdate: (u: Partial<StudioSection>) => void; onDelete: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-2">
        <div>
          <Label className="text-xs">Label</Label>
          <Input value={section.label || ''} onChange={e => onUpdate({ label: e.target.value })} className="h-7 text-xs mt-1" />
        </div>
        <div>
          <Label className="text-xs">Columns</Label>
          <Select value={String(section.columns)} onValueChange={v => onUpdate({ columns: Number(v) as 1 | 2 })}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="text-xs">1 Column</SelectItem>
              <SelectItem value="2" className="text-xs">2 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Visible</Label>
          <Switch checked={section.visible} onCheckedChange={v => onUpdate({ visible: v })} className="scale-75" />
        </div>
      </div>
    </div>
  );
}

function TabProperties({ tab, onUpdate, onDelete }: { tab: StudioTab; onUpdate: (u: Partial<StudioTab>) => void; onDelete: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tab</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-2">
        <div>
          <Label className="text-xs">Label</Label>
          <Input value={tab.label} onChange={e => onUpdate({ label: e.target.value })} className="h-7 text-xs mt-1" />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Visible</Label>
          <Switch checked={tab.visible} onCheckedChange={v => onUpdate({ visible: v })} className="scale-75" />
        </div>
      </div>
    </div>
  );
}

// === Add Dialogs ===

function AddFieldDialog({ open, onOpenChange, onAdd, sections }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (field: StudioField, sectionId: string) => void;
  sections: StudioSection[];
}) {
  const [label, setLabel] = useState('');
  const [widget, setWidget] = useState<FieldWidgetType>('text');
  const [sectionId, setSectionId] = useState(sections[0]?.id || '');

  useEffect(() => { if (open) { setLabel(''); setWidget('text'); setSectionId(sections[0]?.id || ''); } }, [open, sections]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Field</DialogTitle>
          <DialogDescription>Add a new field to the form</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Label</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} className="h-8 text-sm mt-1" placeholder="" />
          </div>
          <div>
            <Label className="text-xs">Widget Type</Label>
            <Select value={widget} onValueChange={v => setWidget(v as FieldWidgetType)}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WIDGET_OPTIONS.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Section</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.label || `Section ${s.order + 1}`}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!label} onClick={() => {
            onAdd({
              id: `field_${Date.now()}`,
              label,
              technicalName: label.toLowerCase().replace(/\s+/g, '_'),
              widget,
              required: false,
              visible: true,
              readOnly: false,
              colSpan: 1,
            }, sectionId);
            onOpenChange(false);
            toast.success('Field added');
          }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSmartButtonDialog({ open, onOpenChange, onAdd }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (btn: StudioSmartButton) => void;
}) {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('FileText');
  const [targetModule, setTargetModule] = useState('crm');
  const [targetRoute, setTargetRoute] = useState('');

  useEffect(() => { if (open) { setLabel(''); setIcon('FileText'); setTargetModule('crm'); setTargetRoute(''); } }, [open]);

  const routes = MODULE_REGISTRY.find(m => m.id === targetModule)?.routes || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Smart Button</DialogTitle>
          <DialogDescription>Link to related records in another module</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Label</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} className="h-8 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs">Icon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{SMART_BUTTON_ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Target Module</Label>
            <Select value={targetModule} onValueChange={v => { setTargetModule(v); setTargetRoute(''); }}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{MODULE_REGISTRY.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Target Page</Label>
            <Select value={targetRoute} onValueChange={setTargetRoute}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select page" /></SelectTrigger>
              <SelectContent>{routes.map(r => <SelectItem key={r.path} value={r.path}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!label || !targetRoute} onClick={() => {
            onAdd({ id: `sb_${Date.now()}`, label, icon, targetModule, targetRoute, visible: true });
            onOpenChange(false);
            toast.success('Smart button added');
          }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddActionButtonDialog({ open, onOpenChange, onAdd }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (btn: StudioActionButton) => void;
}) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<StudioActionButton['type']>('primary');
  const [action, setAction] = useState<StudioActionButton['action']>('navigate');

  useEffect(() => { if (open) { setLabel(''); setType('primary'); setAction('navigate'); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Action Button</DialogTitle>
          <DialogDescription>Add a button that triggers an action</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Label</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} className="h-8 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs">Style</Label>
            <Select value={type} onValueChange={v => setType(v as typeof type)}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="danger">Danger</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Action</Label>
            <Select value={action} onValueChange={v => setAction(v as typeof action)}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="navigate">Navigate</SelectItem>
                <SelectItem value="status_change">Change Status</SelectItem>
                <SelectItem value="print">Print</SelectItem>
                <SelectItem value="email">Send Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!label} onClick={() => {
            onAdd({ id: `ab_${Date.now()}`, label, type, action, visible: true, position: 'header', order: 0 });
            onOpenChange(false);
            toast.success('Action button added');
          }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSectionDialog({ open, onOpenChange, onAdd, nextOrder }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (section: StudioSection) => void;
  nextOrder: number;
}) {
  const [label, setLabel] = useState('');
  const [columns, setColumns] = useState<1 | 2>(2);

  useEffect(() => { if (open) { setLabel(''); setColumns(2); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>Create a new form section</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Label (optional)</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} className="h-8 text-sm mt-1" placeholder="" />
          </div>
          <div>
            <Label className="text-xs">Columns</Label>
            <Select value={String(columns)} onValueChange={v => setColumns(Number(v) as 1 | 2)}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Column</SelectItem>
                <SelectItem value="2">2 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={() => {
            onAdd({ id: `section_${Date.now()}`, label: label || undefined, columns, visible: true, order: nextOrder, fieldIds: [] });
            onOpenChange(false);
            toast.success('Section added');
          }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTabDialog({ open, onOpenChange, onAdd, nextOrder }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (tab: StudioTab) => void;
  nextOrder: number;
}) {
  const [label, setLabel] = useState('');

  useEffect(() => { if (open) setLabel(''); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Tab</DialogTitle>
          <DialogDescription>Create a new form tab</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label className="text-xs">Label</Label>
          <Input value={label} onChange={e => setLabel(e.target.value)} className="h-8 text-sm mt-1" placeholder="" />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!label} onClick={() => {
            onAdd({ id: `tab_${Date.now()}`, label, visible: true, order: nextOrder, fields: [] });
            onOpenChange(false);
            toast.success('Tab added');
          }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
