import type {
  TemplateDocument, OsDefinition, TemplateItem, OsMapping,
  ItemPayload, ItemType,
  RegistryPayload, ServicePayload, ScheduledTaskPayload,
  StoreAppPayload, PowerShellPayload, FileFolderPayload
} from './types'

export function parseXml(xmlString: string): TemplateDocument {
  const doc = new DOMParser().parseFromString(xmlString, 'application/xml')
  const err = doc.querySelector('parsererror')
  if (err) throw new Error('XML parse error: ' + (err.textContent ?? '').slice(0, 300))
  return {
    supportedOs: parseSupportedOs(doc),
    items: parseItems(doc)
  }
}

function parseSupportedOs(doc: Document): OsDefinition[] {
  return Array.from(doc.querySelectorAll('SupportedOS > OS')).map(el => ({
    tag: text(el, 'Tag'),
    name: text(el, 'Name'),
    abbreviation: text(el, 'Abbreviation'),
    isServerOs: text(el, 'ServerOS') === '1',
    buildStartsWith: Array.from(el.querySelectorAll('BuildStartsWith'))
      .map(b => b.textContent?.trim() ?? '')
      .filter(Boolean)
  }))
}

function parseItems(doc: Document): TemplateItem[] {
  return Array.from(doc.querySelectorAll('Items > Item')).map(el => {
    const typeRaw = text(el, 'Type')
    const type = resolveType(typeRaw)
    return {
      id: crypto.randomUUID(),
      name: text(el, 'Name'),
      description: text(el, 'Description'),
      type,
      typeRaw,
      category: text(el, 'Category'),
      order: parseOrder(text(el, 'Order')),
      os: parseOsMappings(el),
      payload: parsePayload(el, type)
    }
  })
}

function text(el: Element, tag: string): string {
  return el.querySelector(tag)?.textContent?.trim() ?? ''
}

function resolveType(raw: string): ItemType {
  const lower = raw.toLowerCase()
  const map: Record<string, ItemType> = {
    registry: 'Registry',
    service: 'Service',
    scheduledtask: 'ScheduledTask',
    storeapp: 'StoreApp',
    powershell: 'PowerShell',
    filefolder: 'FileFolder'
  }
  return map[lower] ?? 'Unknown'
}

function parseOrder(raw: string): number {
  if (!raw) return 100
  const n = parseInt(raw, 10)
  return isNaN(n) ? 100 : n
}

function parseOsMappings(item: Element): Record<string, OsMapping> {
  const osEl = item.querySelector('OS')
  if (!osEl) return {}
  const result: Record<string, OsMapping> = {}
  for (const child of Array.from(osEl.children)) {
    result[child.tagName] = {
      execute: child.querySelector('Execute')?.textContent?.trim() === '1',
      physical: child.querySelector('Physical')?.textContent?.trim() === '1',
      virtual: child.querySelector('Virtual')?.textContent?.trim() === '1'
    }
  }
  return result
}

function parsePayload(el: Element, type: ItemType): ItemPayload {
  switch (type) {
    case 'Registry':      return parseRegistry(el)
    case 'Service':       return parseService(el)
    case 'ScheduledTask': return parseScheduledTask(el)
    case 'StoreApp':      return parseStoreApp(el)
    case 'PowerShell':    return parsePowerShell(el)
    case 'FileFolder':    return parseFileFolder(el)
    default:              return { type: 'Unknown' }
  }
}

function parseRegistry(el: Element): RegistryPayload {
  const r = el.querySelector('Registry')
  if (!r) return { type: 'Registry', hive: 'HKLM', path: '', name: '', action: 'SetValue', value: '', registryType: 'DWord' }
  let action = text(r, 'Action') || 'SetValue'
  const name = text(r, 'Name')
  // Legacy "Delete" migration
  if (action.toLowerCase() === 'delete') action = name === '' ? 'DeleteKey' : 'DeleteValue'
  return {
    type: 'Registry',
    hive: text(r, 'Hive') || 'HKLM',
    path: text(r, 'Path'),
    name,
    action,
    value: text(r, 'Value'),
    registryType: text(r, 'Type')
  }
}

function parseService(el: Element): ServicePayload {
  const s = el.querySelector('Service')
  if (!s) return { type: 'Service', name: '', action: 'Disabled' }
  return { type: 'Service', name: text(s, 'Name'), action: text(s, 'Action') || 'Disabled' }
}

function parseScheduledTask(el: Element): ScheduledTaskPayload {
  const st = el.querySelector('ScheduledTask')
  if (!st) return { type: 'ScheduledTask', name: '', path: '', action: 'Disabled' }
  return { type: 'ScheduledTask', name: text(st, 'Name'), path: text(st, 'Path'), action: text(st, 'Action') || 'Disabled' }
}

function parseStoreApp(el: Element): StoreAppPayload {
  const sa = el.querySelector('StoreApp')
  return { type: 'StoreApp', name: sa ? text(sa, 'Name') : '' }
}

function parsePowerShell(el: Element): PowerShellPayload {
  const ps = el.querySelector('PowerShell')
  if (!ps) return { type: 'PowerShell', engine: 'powershell', script: '' }
  const scriptEl = ps.querySelector('Script')
  return {
    type: 'PowerShell',
    engine: text(ps, 'Engine') || 'powershell',
    script: scriptEl?.textContent ?? ''
  }
}

function parseFileFolder(el: Element): FileFolderPayload {
  const ff = el.querySelector('FileFolder')
  if (!ff) return { type: 'FileFolder', path: '', action: 'Remove', itemType: 'File', newName: '' }
  return {
    type: 'FileFolder',
    path: text(ff, 'Path'),
    action: text(ff, 'Action') || 'Remove',
    itemType: text(ff, 'ItemType') || 'File',
    newName: text(ff, 'NewName')
  }
}
