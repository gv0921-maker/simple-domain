// CRM Filter Popover — reusable filter UI for Leads and Contacts
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  group?: string;
}

export interface ActiveFilter {
  id: string;
  label: string;
}

interface CRMFilterPopoverProps {
  options: FilterOption[];
  activeFilters: ActiveFilter[];
  onToggleFilter: (filter: FilterOption) => void;
  onClearAll: () => void;
}

export function CRMFilterPopover({ options, activeFilters, onToggleFilter, onClearAll }: CRMFilterPopoverProps) {
  const [open, setOpen] = useState(false);

  // Group options
  const groups = options.reduce<Record<string, FilterOption[]>>((acc, opt) => {
    const group = opt.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Filter className="h-4 w-4" />
            {activeFilters.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Filters</span>
              {activeFilters.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onClearAll}>
                  Clear all
                </Button>
              )}
            </div>
            {Object.entries(groups).map(([groupName, groupOptions]) => (
              <div key={groupName}>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{groupName}</span>
                <div className="mt-1 space-y-1">
                  {groupOptions.map(opt => {
                    const isActive = activeFilters.some(f => f.id === opt.id);
                    return (
                      <label key={opt.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-1">
                        <Checkbox
                          checked={isActive}
                          onCheckedChange={() => onToggleFilter(opt)}
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {activeFilters.map(f => (
        <Badge key={f.id} variant="secondary" className="gap-1 text-xs">
          {f.label}
          <button onClick={() => onToggleFilter({ id: f.id, label: f.label })} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
