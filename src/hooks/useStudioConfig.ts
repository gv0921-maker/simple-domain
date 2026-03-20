// Hook to get studio form configuration for a module/form
import { useMemo } from 'react';
import { getStudioForm } from '@/lib/customization/studioStorage';
import { StudioFormConfig, StudioField, StudioSection } from '@/lib/customization/studioTypes';

export interface StudioFieldConfig {
  id: string;
  label: string;
  technicalName: string;
  widget: string;
  placeholder?: string;
  required: boolean;
  visible: boolean;
  readOnly: boolean;
  colSpan: 1 | 2;
  options?: { label: string; value: string }[];
  tooltip?: string;
  defaultValue?: string;
}

export interface StudioSectionConfig {
  id: string;
  label?: string;
  columns: 1 | 2;
  visible: boolean;
  order: number;
  fields: StudioFieldConfig[];
}

export function useStudioConfig(moduleId: string, formName: string) {
  const config = useMemo(() => getStudioForm(moduleId, formName), [moduleId, formName]);

  // Get ordered visible sections with their fields
  const sections = useMemo((): StudioSectionConfig[] => {
    return config.sections
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order)
      .map(section => ({
        ...section,
        fields: section.fieldIds
          .map(fid => config.fields.find(f => f.id === fid))
          .filter((f): f is StudioField => !!f && f.visible),
      }));
  }, [config]);

  // Get all visible fields (flat, ordered by section)
  const visibleFields = useMemo((): StudioFieldConfig[] => {
    return sections.flatMap(s => s.fields);
  }, [sections]);

  // Helper: check if a field (by technicalName or id) is visible
  const isFieldVisible = useMemo(() => {
    const visibleSet = new Set(
      config.fields.filter(f => f.visible).flatMap(f => [f.id, f.technicalName])
    );
    return (fieldIdOrTechnicalName: string) => visibleSet.has(fieldIdOrTechnicalName);
  }, [config.fields]);

  // Helper: get field config by technicalName or id
  const getField = useMemo(() => {
    const fieldMap = new Map<string, StudioField>();
    config.fields.forEach(f => {
      fieldMap.set(f.id, f);
      fieldMap.set(f.technicalName, f);
    });
    return (fieldIdOrTechnicalName: string) => fieldMap.get(fieldIdOrTechnicalName);
  }, [config.fields]);

  // Get field label (overridden by studio config)
  const getFieldLabel = (fieldIdOrTechnicalName: string, fallback: string): string => {
    const field = getField(fieldIdOrTechnicalName);
    return field?.label || fallback;
  };

  // Check if field is required (overridden by studio config)
  const isFieldRequired = (fieldIdOrTechnicalName: string, fallback: boolean = false): boolean => {
    const field = getField(fieldIdOrTechnicalName);
    return field?.required ?? fallback;
  };

  // Get field placeholder
  const getFieldPlaceholder = (_fieldIdOrTechnicalName: string, _fallback?: string): string => {
    return '';
  };

  // Check if field is read-only
  const isFieldReadOnly = (fieldIdOrTechnicalName: string, fallback: boolean = false): boolean => {
    const field = getField(fieldIdOrTechnicalName);
    return field?.readOnly ?? fallback;
  };

  return {
    config,
    sections,
    visibleFields,
    isFieldVisible,
    getField,
    getFieldLabel,
    isFieldRequired,
    getFieldPlaceholder,
    isFieldReadOnly,
  };
}
