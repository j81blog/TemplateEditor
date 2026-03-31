<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-backdrop" @click.self="emit('update:visible', false)">
      <div class="dialog">
        <div class="dlg-header">
          <span class="dlg-title">Generate Report</span>
          <button class="dlg-close" data-tooltip="Close without generating" @click="emit('update:visible', false)">×</button>
        </div>

        <div class="dlg-body">
          <!-- OS section -->
          <div class="section">
            <div class="section-hdr">Operating System</div>
            <div class="section-body">
              <label class="radio-row">
                <input type="radio" v-model="osMode" value="all" /> All OS
              </label>
              <label class="radio-row">
                <input type="radio" v-model="osMode" value="select" /> Select OS
              </label>
              <div v-if="osMode === 'select'" class="os-checklist">
                <label v-for="o in supportedOs" :key="o.tag" class="check-row">
                  <input type="checkbox" :value="o.tag" v-model="selectedTags" />
                  {{ o.name }}
                </label>
              </div>
            </div>
          </div>

          <!-- Sort section -->
          <div class="section">
            <div class="section-hdr">Sort by</div>
            <div class="section-body">
              <label class="radio-row"><input type="radio" v-model="sortBy" value="name" /> Alphabetical (by name)</label>
              <label class="radio-row"><input type="radio" v-model="sortBy" value="order" /> Order (by order number)</label>
              <label class="radio-row"><input type="radio" v-model="sortBy" value="category" /> Category (then alphabetical)</label>
            </div>
          </div>
        </div>

        <div class="dlg-footer">
          <button class="dlg-btn" data-tooltip="Cancel and close" @click="emit('update:visible', false)">Cancel</button>
          <button class="dlg-btn primary" data-tooltip="Generate and download the PDF report" @click="onExport">Generate</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { documentStore } from '../store/document'
import { exportPdf } from '../core/pdfExport'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [boolean] }>()

const osMode = ref<'all' | 'select'>('all')
const selectedTags = ref<string[]>([])
const sortBy = ref<'name' | 'order' | 'category'>('name')
const supportedOs = computed(() => documentStore.document?.supportedOs ?? [])

// Pre-select all when switching to "select" mode
watch(osMode, v => {
  if (v === 'select' && selectedTags.value.length === 0)
    selectedTags.value = supportedOs.value.map(o => o.tag)
})

async function onExport() {
  if (!documentStore.document) return
  const tags = osMode.value === 'all' ? [] : selectedTags.value
  await exportPdf(documentStore.document, tags, sortBy.value)
  emit('update:visible', false)
}
</script>

<style scoped>
.dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 10px; width: 360px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
.dlg-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--card-border); }
.dlg-title { font-size: 14px; font-weight: 700; color: var(--bc-name); }
.dlg-close { background: none; border: none; color: var(--field-label); font-size: 20px; cursor: pointer; line-height: 1; }
.dlg-body { display: flex; flex-direction: column; gap: 0; overflow-y: auto; }
.section { border-bottom: 1px solid var(--card-border); }
.section:last-child { border-bottom: none; }
.section-hdr { padding: 10px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: var(--item-bar); color: #fff; }
.section-body { padding: 12px 20px; display: flex; flex-direction: column; gap: 8px; }
.radio-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--field-txt); cursor: pointer; }
.radio-row input[type="radio"] { accent-color: var(--item-bar); width: 15px; height: 15px; cursor: pointer; }
.os-checklist { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; padding-left: 24px; max-height: 180px; overflow-y: auto; }
.check-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--field-txt); cursor: pointer; }
.check-row input[type="checkbox"] { accent-color: var(--item-bar); width: 15px; height: 15px; cursor: pointer; }
.dlg-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--card-border); }
.dlg-btn { padding: 7px 18px; border-radius: 6px; border: 1px solid var(--sb-btn-bdr); background: var(--sb-btn-bg); color: var(--sb-btn-txt); font-size: 12px; font-family: 'Montserrat', sans-serif; font-weight: 600; cursor: pointer; }
.dlg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.dlg-btn.primary { background: var(--btn-primary-bg); border-color: var(--btn-primary-bdr); color: var(--btn-primary-txt); }
</style>
