import { reactive } from 'vue'
import { validate } from '../core/validator'
import type { TemplateDocument, TemplateItem, OsDefinition, ValidationResult } from '../core/types'

export const documentStore = reactive({
  document: null as TemplateDocument | null,
  dirty: false,
  filename: 'Windows.xml',

  get validationResult(): ValidationResult {
    if (!this.document) return { errors: [], warnings: [] }
    return validate(this.document)
  },

  get hasErrors(): boolean {
    return this.validationResult.errors.length > 0
  },

  load(doc: TemplateDocument, filename: string) {
    this.document = doc
    this.dirty = false
    this.filename = filename
  },

  addItem(item: TemplateItem) {
    this.document?.items.push(item)
    this.dirty = true
  },

  updateItem(id: string, patch: Partial<TemplateItem>) {
    const item = this.document?.items.find(i => i.id === id)
    if (item) Object.assign(item, patch)
    this.dirty = true
  },

  deleteItem(id: string) {
    if (!this.document) return
    this.document.items = this.document.items.filter(i => i.id !== id)
    this.dirty = true
  },

  setOsDefinitions(osList: OsDefinition[]) {
    if (!this.document) return
    const validTags = new Set(osList.map(o => o.tag))
    for (const item of this.document.items) {
      for (const tag of Object.keys(item.os)) {
        if (!validTags.has(tag)) delete item.os[tag]
      }
    }
    this.document.supportedOs = osList
    this.dirty = true
  }
})
