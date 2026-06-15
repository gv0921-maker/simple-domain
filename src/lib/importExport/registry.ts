// Universal Import/Export schema registry.
// Modules register their schema; UI components & edge functions read from here.

export type ColumnType = 'text' | 'number' | 'date' | 'enum' | 'boolean' | 'fk';

export interface FkResolver {
  table: string;
  displayField: string;
  valueField: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  required?: boolean;
  enumOptions?: string[];
  fkResolver?: FkResolver;
  exampleValue?: unknown;
  transform?: (raw: unknown) => unknown;
}

export interface ImportExportSchema {
  moduleKey: string;
  displayName: string;
  table: string;
  upsertKey: string;
  columns: ColumnDef[];
  /** Permissions are role keys; checked against useRoleCheck / RBAC. */
  permissions: { import: string[]; export: string[] };
}

const _registry: Record<string, ImportExportSchema> = {};

export function registerImportExport(schema: ImportExportSchema): void {
  _registry[schema.moduleKey] = schema;
}

export function getSchema(moduleKey: string): ImportExportSchema | undefined {
  return _registry[moduleKey];
}

export function listSchemas(): ImportExportSchema[] {
  return Object.values(_registry);
}

export const importExportRegistry = _registry;