import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomization } from '@/contexts/CustomizationContext';
import { ModuleConfig, COLOR_PRESETS, AVAILABLE_ICONS, IconName } from '@/lib/customization/types';
import { getIcon, getAllIcons } from '@/lib/customization/icons';
import { GripVertical, Pencil, RotateCcw, Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'sonner';

export function ModuleCustomization() {
  const { state, updateModule, resetModules, reorderModules } = useCustomization();
  const [editingModule, setEditingModule] = useState<ModuleConfig | null>(null);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);

  const sortedModules = [...state.modules].sort((a, b) => a.order - b.order);

  const handleDragStart = (moduleId: string) => {
    setDraggedModule(moduleId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedModule || draggedModule === targetId) return;

    const draggedIndex = sortedModules.findIndex((m) => m.id === draggedModule);
    const targetIndex = sortedModules.findIndex((m) => m.id === targetId);

    const newModules = [...sortedModules];
    const [removed] = newModules.splice(draggedIndex, 1);
    newModules.splice(targetIndex, 0, removed);
    reorderModules(newModules);
  };

  const handleDragEnd = () => {
    setDraggedModule(null);
  };

  const handleSaveModule = (module: ModuleConfig) => {
    updateModule(module.id, module);
    setEditingModule(null);
    toast.success(`${module.name} updated`);
  };

  const handleResetAll = () => {
    resetModules();
    toast.success('Modules reset to defaults');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium">Module Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Drag to reorder, click to edit names, icons, and colors
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetAll} className="gap-1">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {sortedModules.map((module) => {
          const Icon = getIcon(module.icon);
          return (
            <div
              key={module.id}
              draggable
              onDragStart={() => handleDragStart(module.id)}
              onDragOver={(e) => handleDragOver(e, module.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors cursor-move ${
                draggedModule === module.id ? 'opacity-50' : ''
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: module.iconBg }}
              >
                <Icon className="w-5 h-5" style={{ color: module.iconColor }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{module.name}</p>
                <p className="text-xs text-muted-foreground truncate">{module.href}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={module.visible ? 'default' : 'secondary'} className="text-xs">
                  {module.visible ? 'Visible' : 'Hidden'}
                </Badge>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateModule(module.id, { visible: !module.visible });
                  }}
                >
                  {module.visible ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModule({ ...module });
                      }}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Module</DialogTitle>
                      <DialogDescription>
                        Customize the module's name, icon, and colors
                      </DialogDescription>
                    </DialogHeader>
                    {editingModule && editingModule.id === module.id && (
                      <ModuleEditForm
                        module={editingModule}
                        onChange={setEditingModule}
                        onSave={handleSaveModule}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function ModuleEditForm({
  module,
  onChange,
  onSave,
}: {
  module: ModuleConfig;
  onChange: (module: ModuleConfig) => void;
  onSave: (module: ModuleConfig) => void;
}) {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const Icon = getIcon(module.icon);
  const allIcons = getAllIcons();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Module Name</Label>
        <Input
          value={module.name}
          onChange={(e) => onChange({ ...module, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex items-center gap-2">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center border border-border"
            style={{ backgroundColor: module.iconBg }}
          >
            <Icon className="w-6 h-6" style={{ color: module.iconColor }} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIconPicker(!showIconPicker)}
          >
            Change Icon
          </Button>
        </div>
        {showIconPicker && (
          <ScrollArea className="h-40 border rounded-lg p-2">
            <div className="grid grid-cols-8 gap-1">
              {allIcons.map(({ name, icon: ItemIcon }) => (
                <button
                  key={name}
                  onClick={() => {
                    onChange({ ...module, icon: name });
                    setShowIconPicker(false);
                  }}
                  className={`p-2 rounded hover:bg-muted transition-colors ${
                    module.icon === name ? 'bg-primary/10 ring-1 ring-primary' : ''
                  }`}
                >
                  <ItemIcon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="space-y-2">
        <Label>Color Preset</Label>
        <div className="grid grid-cols-6 gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() =>
                onChange({ ...module, iconBg: preset.bg, iconColor: preset.color })
              }
              className={`relative w-10 h-10 rounded-lg border-2 transition-all ${
                module.iconColor === preset.color
                  ? 'border-primary scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: preset.bg }}
              title={preset.name}
            >
              <div
                className="absolute inset-2 rounded"
                style={{ backgroundColor: preset.color }}
              />
              {module.iconColor === preset.color && (
                <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Custom Colors</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Background</Label>
            <input
              type="color"
              value={module.iconBg}
              onChange={(e) => onChange({ ...module, iconBg: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Icon</Label>
            <input
              type="color"
              value={module.iconColor}
              onChange={(e) => onChange({ ...module, iconColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={module.visible}
            onCheckedChange={(checked) => onChange({ ...module, visible: checked })}
          />
          <Label className="text-sm">Visible in menu</Label>
        </div>
        <Button onClick={() => onSave(module)}>Save Changes</Button>
      </div>
    </div>
  );
}
