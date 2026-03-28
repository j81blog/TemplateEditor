// ── OS Definition (SupportedOS entry) ────────────────────────────────────────
export interface OsDefinition {
  tag: string             // unique XML element name e.g. "Windows11"
  name: string            // display name e.g. "Windows 11"
  abbreviation: string    // short label e.g. "W11"
  isServerOs: boolean
  buildStartsWith: string[]
}

// ── OS Mapping per item ───────────────────────────────────────────────────────
// Constraint: if physical=false AND virtual=false then execute must be false.
// Presence of key in TemplateItem.os means "supported". Absent key = not supported.
export interface OsMapping {
  execute: boolean
  physical: boolean
  virtual: boolean
}

// ── Template Document (root) ──────────────────────────────────────────────────
export interface TemplateDocument {
  supportedOs: OsDefinition[]
  items: TemplateItem[]
}

// ── Item ──────────────────────────────────────────────────────────────────────
export interface TemplateItem {
  id: string              // internal UUID, never written to XML
  name: string
  description: string
  type: ItemType
  typeRaw: string         // original casing from XML, used in serialization
  category: string
  order: number           // 0–99999, default 100
  os: Record<string, OsMapping>   // key = OsDefinition.tag
  payload: ItemPayload
}

export type ItemType =
  | 'Registry'
  | 'Service'
  | 'ScheduledTask'
  | 'StoreApp'
  | 'PowerShell'
  | 'FileFolder'
  | 'Unknown'

// ── Payloads ──────────────────────────────────────────────────────────────────
export interface RegistryPayload {
  type: 'Registry'
  hive: string            // HKLM | HKCU | HKU | HKU\DefaultUser
  path: string
  name: string            // value name; empty string = default value
  action: string          // SetValue | DeleteKey | DeleteKeyRecursively | DeleteValue
  value: string
  registryType: string    // String | ExpandString | Binary | DWord | MultiString | Qword
}

export interface ServicePayload {
  type: 'Service'
  name: string
  action: string          // Disabled | Automatic | Manual
}

export interface ScheduledTaskPayload {
  type: 'ScheduledTask'
  name: string
  path: string
  action: string          // Enabled | Disabled
}

export interface StoreAppPayload {
  type: 'StoreApp'
  name: string
}

export interface PowerShellPayload {
  type: 'PowerShell'
  engine: string          // powershell | pwsh
  script: string
}

export interface FileFolderPayload {
  type: 'FileFolder'
  path: string
  action: string          // Delete | Rename | Remove
  itemType: string        // File | Folder
  newName: string         // required when action=Rename
}

export interface UnknownPayload {
  type: 'Unknown'
}

export type ItemPayload =
  | RegistryPayload
  | ServicePayload
  | ScheduledTaskPayload
  | StoreAppPayload
  | PowerShellPayload
  | FileFolderPayload
  | UnknownPayload

// ── Validation ────────────────────────────────────────────────────────────────
export type Severity = 'Error' | 'Warning'

export interface ValidationIssue {
  severity: Severity
  code: string
  path: string
  message: string
  itemId?: string
}

export interface ValidationResult {
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

// ── UI state types ────────────────────────────────────────────────────────────
export type ViewMode = 'category' | 'order'
export type SortDir = 'asc' | 'desc'

export interface UiFilters {
  search: string
  category: string
  type: string
  os: string
}
