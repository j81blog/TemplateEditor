import { describe, it, expect } from 'vitest'
import { validate } from '../../src/core/validator'
import type { TemplateDocument, TemplateItem } from '../../src/core/types'

function makeItem(overrides: Partial<TemplateItem> = {}): TemplateItem {
  return {
    id: 'test-1', name: 'My Item', description: '', type: 'Service', typeRaw: 'Service',
    category: 'General', order: 100, os: {},
    payload: { type: 'Service', name: 'svc', action: 'Disabled' },
    ...overrides
  }
}

function makeDoc(overrides: Partial<TemplateDocument> = {}): TemplateDocument {
  return {
    supportedOs: [{ tag: 'Windows11', name: 'Windows 11', abbreviation: 'W11', isServerOs: false, buildStartsWith: ['21'] }],
    items: [makeItem()],
    ...overrides
  }
}

it('errors on empty name', () => {
  expect(validate(makeDoc({ items: [makeItem({ name: '' })] })).errors.some(e => e.code === 'ITEM_NAME_REQUIRED')).toBe(true)
})

it('errors on empty category', () => {
  expect(validate(makeDoc({ items: [makeItem({ category: '' })] })).errors.some(e => e.code === 'ITEM_CATEGORY_REQUIRED')).toBe(true)
})

it('errors on order > 99999', () => {
  expect(validate(makeDoc({ items: [makeItem({ order: 100000 })] })).errors.some(e => e.code === 'ITEM_ORDER_RANGE')).toBe(true)
})

it('passes on order 0', () => {
  expect(validate(makeDoc({ items: [makeItem({ order: 0 })] })).errors.some(e => e.code === 'ITEM_ORDER_RANGE')).toBe(false)
})

it('errors on unknown OS mapping tag', () => {
  expect(validate(makeDoc({ items: [makeItem({ os: { UnknownOS: { execute: true, physical: true, virtual: false } } })] }))
    .errors.some(e => e.code === 'OS_MAPPING_UNKNOWN_TAG')).toBe(true)
})

it('errors on duplicate OS tag', () => {
  const os = { tag: 'Windows11', name: 'W11', abbreviation: 'W11', isServerOs: false, buildStartsWith: ['21'] }
  expect(validate(makeDoc({ supportedOs: [os, { ...os, name: 'Dup' }] })).errors.some(e => e.code === 'OS_TAG_DUPLICATE')).toBe(true)
})

it('errors on missing Registry path', () => {
  expect(validate(makeDoc({ items: [makeItem({
    type: 'Registry', typeRaw: 'Registry',
    payload: { type: 'Registry', hive: 'HKLM', path: '', name: 'v', action: 'SetValue', value: '1', registryType: 'DWord' }
  })] })).errors.some(e => e.code === 'FIELD_REQUIRED' && e.path.includes('Path'))).toBe(true)
})

it('errors on invalid DWord value', () => {
  expect(validate(makeDoc({ items: [makeItem({
    type: 'Registry', typeRaw: 'Registry',
    payload: { type: 'Registry', hive: 'HKLM', path: 'SW\\Test', name: 'v', action: 'SetValue', value: 'notanumber', registryType: 'DWord' }
  })] })).errors.some(e => e.code === 'FIELD_FORMAT')).toBe(true)
})

it('returns no errors for a valid document', () => {
  expect(validate(makeDoc()).errors).toHaveLength(0)
})
