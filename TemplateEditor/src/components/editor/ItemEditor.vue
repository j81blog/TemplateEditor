<template>
  <div v-if="!item" class="editor-empty">
    <p>Select an item from the sidebar or create a new one.</p>
  </div>

  <div v-else class="editor-layout">
    <!-- Breadcrumb -->
    <div class="bc-bar">
      <span class="bc-cat">{{ item.category || '—' }}</span>
      <span class="bc-sep">›</span>
      <span class="bc-name">{{ item.name || '(unnamed)' }}</span>
      <span class="bc-badge">{{ item.type }}</span>
    </div>

    <!-- Scrollable editor column -->
    <div class="editor-scroll">
      <!-- Two-column: left = General+Payload, right = OS Mapping (starts at same height) -->
      <div class="editor-cols">
        <div class="editor-main">
          <!-- General card -->
          <div class="card" style="margin-bottom:12px">
            <div class="card-hdr">
              <div class="c-accent" :style="{ background: accentColor }"></div>
              <span class="c-label">General</span>
            </div>
            <div class="card-body">
              <div class="form-row">
                <div class="fg">
                  <div class="field">
                    <label class="field-lbl">Name *</label>
                    <input class="field-inp" :value="item.name" @input="update('name', ($event.target as HTMLInputElement).value)" />
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="fg">
                  <div class="field">
                    <label class="field-lbl">Description</label>
                    <input class="field-inp" :value="item.description" @input="update('description', ($event.target as HTMLInputElement).value)" />
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="fg">
                  <div class="field">
                    <label class="field-lbl">Type *</label>
                    <select class="field-inp" :value="item.type" @change="onTypeChange(($event.target as HTMLSelectElement).value as ItemType)">
                      <option v-for="t in ITEM_TYPES" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </div>
                </div>
                <div class="fg">
                  <div class="field">
                    <label class="field-lbl">Category *</label>
                    <input class="field-inp" list="cat-list" :value="item.category" @input="update('category', ($event.target as HTMLInputElement).value)" />
                    <datalist id="cat-list">
                      <option v-for="c in categories" :key="c" :value="c" />
                    </datalist>
                  </div>
                </div>
                <div style="flex:0 0 100px">
                  <div class="field">
                    <label class="field-lbl">Order</label>
                    <input class="field-inp" type="number" min="0" max="99999" :value="item.order"
                      @input="update('order', parseInt(($event.target as HTMLInputElement).value) || 100)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Payload card -->
          <component :is="payloadComponent" :item="item" @update="onPayloadUpdate" />
        </div>
        <div class="editor-side">
          <OSMappingTable :item="item" />
        </div>
      </div>

      <!-- Validation issues for this item -->
      <div v-if="itemErrors.length" class="item-issues">
        <div v-for="issue in itemErrors" :key="issue.code + issue.path" class="issue-row" :class="issue.severity.toLowerCase()">
          <span class="issue-icon">{{ issue.severity === 'Error' ? '✕' : '⚠' }}</span>
          <span class="issue-msg">{{ issue.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { documentStore } from '../../store/document'
import { uiStore } from '../../store/ui'
import type { TemplateItem, ItemType, ItemPayload } from '../../core/types'
import OSMappingTable from '../OSMappingTable.vue'

const ITEM_TYPES: ItemType[] = ['Registry','Service','ScheduledTask','StoreApp','PowerShell','FileFolder']

const accentMap: Record<string, string> = {
  Registry: '#fb923c', Service: '#38bdf8', ScheduledTask: '#a78bfa',
  StoreApp: '#f472b6', PowerShell: '#4ade80', FileFolder: '#2dd4bf', Unknown: '#94a3b8'
}

const item = computed(() => documentStore.document?.items.find(i => i.id === uiStore.selectedId) ?? null)
const categories = computed(() => [...new Set(documentStore.document?.items.map(i => i.category).filter(Boolean))].sort())
const accentColor = computed(() => accentMap[item.value?.type ?? 'Unknown'])
const itemErrors = computed(() => documentStore.validationResult.errors.filter(e => e.itemId === item.value?.id))

const payloadComponents: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  Registry: defineAsyncComponent(() => import('./payload/PayloadRegistry.vue')),
  Service: defineAsyncComponent(() => import('./payload/PayloadService.vue')),
  ScheduledTask: defineAsyncComponent(() => import('./payload/PayloadScheduledTask.vue')),
  StoreApp: defineAsyncComponent(() => import('./payload/PayloadStoreApp.vue')),
  PowerShell: defineAsyncComponent(() => import('./payload/PayloadPowerShell.vue')),
  FileFolder: defineAsyncComponent(() => import('./payload/PayloadFileFolder.vue')),
}

const payloadComponent = computed(() => payloadComponents[item.value?.type ?? ''] ?? null)

function update(field: keyof TemplateItem, value: unknown) {
  if (!item.value) return
  documentStore.updateItem(item.value.id, { [field]: value })
}

function onTypeChange(newType: ItemType) {
  if (!item.value) return
  const defaultPayloads: Record<ItemType, ItemPayload> = {
    Registry: { type: 'Registry', hive: 'HKLM', path: '', name: '', action: 'SetValue', value: '', registryType: 'DWord' },
    Service: { type: 'Service', name: '', action: 'Disabled' },
    ScheduledTask: { type: 'ScheduledTask', name: '', path: '', action: 'Disabled' },
    StoreApp: { type: 'StoreApp', name: '' },
    PowerShell: { type: 'PowerShell', engine: 'powershell', script: '' },
    FileFolder: { type: 'FileFolder', path: '', action: 'Remove', itemType: 'File', newName: '' },
    Unknown: { type: 'Unknown' }
  }
  documentStore.updateItem(item.value.id, { type: newType, typeRaw: newType, payload: defaultPayloads[newType] })
}

function onPayloadUpdate(patch: Partial<ItemPayload>) {
  if (!item.value) return
  documentStore.updateItem(item.value.id, { payload: { ...item.value.payload, ...patch } as ItemPayload })
}
</script>

<style scoped>
.editor-empty { display: flex; align-items: center; justify-content: center; flex: 1; color: var(--field-label); font-size: 13px; }
.editor-layout { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.bc-bar { display: flex; align-items: center; gap: 8px; padding: 9px 16px; background: var(--bc-bg); border-bottom: 1px solid var(--bc-border); flex-shrink: 0; }
.bc-cat { font-size: 11px; color: var(--bc-cat); font-weight: 500; }
.bc-sep { color: var(--bc-cat); }
.bc-name { font-size: 12px; font-weight: 700; color: var(--bc-name); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bc-badge { font-size: 10px; padding: 2px 9px; border-radius: 4px; background: var(--bc-badge-bg); color: var(--bc-badge-txt); font-weight: 700; border: 1px solid var(--bc-badge-bdr); }
.editor-scroll { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.editor-cols { display: flex; gap: 12px; align-items: flex-start; }
.editor-main { flex: 1; min-width: 0; }
.editor-side { width: 380px; flex-shrink: 0; }
.item-issues { display: flex; flex-direction: column; gap: 4px; }
.issue-row { display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px; border-radius: 6px; font-size: 11px; }
.issue-row.error { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #f87171; }
.issue-row.warning { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); color: #fbbf24; }
.issue-icon { font-size: 10px; flex-shrink: 0; margin-top: 1px; }
</style>
