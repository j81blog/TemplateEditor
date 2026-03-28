<template>
  <div class="card">
    <div class="card-hdr">
      <div class="c-accent" style="background:#4ade80"></div>
      <span class="c-label">PowerShell</span>
    </div>
    <div class="card-body">
      <div class="ps-toolbar">
        <span class="ps-engine-lbl">Script Engine:</span>
        <select class="ps-engine-sel" :value="p.engine" @change="emit('update', { engine: ($event.target as HTMLSelectElement).value })">
          <option value="powershell">PowerShell</option>
          <option value="pwsh">pwsh</option>
        </select>
        <div class="ps-toolbar-right">
          <label class="ps-wrap-label">
            <input type="checkbox" v-model="wrap" @change="onWrapChange" />
            Wrap
          </label>
          <span class="ps-cursor">Line: {{ cursor.line }}, Col: {{ cursor.col }} | {{ cursor.chars }} characters</span>
        </div>
      </div>
      <div class="cm-wrapper" ref="editorEl"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { TemplateItem, PowerShellPayload } from '../../../core/types'
import { EditorView, basicSetup } from 'codemirror'
import { StreamLanguage } from '@codemirror/language'
import { Compartment } from '@codemirror/state'
import { powerShell } from '@codemirror/legacy-modes/mode/powershell'
import { oneDark } from '@codemirror/theme-one-dark'

const props = defineProps<{ item: TemplateItem }>()
const emit = defineEmits<{ update: [patch: Partial<PowerShellPayload>] }>()
const p = computed(() => props.item.payload as PowerShellPayload)

const editorEl = ref<HTMLDivElement | null>(null)
const wrap = ref(false)
const cursor = ref({ line: 1, col: 1, chars: 0 })
let view: EditorView | null = null

const wrapCompartment = new Compartment()
const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light'

function buildExtensions() {
  return [
    basicSetup,
    StreamLanguage.define(powerShell),
    ...(isDark() ? [oneDark] : []),
    wrapCompartment.of(wrap.value ? EditorView.lineWrapping : []),
    EditorView.updateListener.of(update => {
      if (update.docChanged) emit('update', { script: update.state.doc.toString() })
      const pos = update.state.selection.main.head
      const line = update.state.doc.lineAt(pos)
      cursor.value = { line: line.number, col: pos - line.from + 1, chars: update.state.doc.length }
    })
  ]
}

onMounted(() => {
  view = new EditorView({ doc: p.value.script ?? '', extensions: buildExtensions(), parent: editorEl.value! })
  // init cursor
  const pos = view.state.selection.main.head
  const line = view.state.doc.lineAt(pos)
  cursor.value = { line: line.number, col: pos - line.from + 1, chars: view.state.doc.length }
})

watch(() => props.item.id, () => {
  if (view && p.value.script !== view.state.doc.toString()) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: p.value.script ?? '' } })
  }
})

function onWrapChange() {
  view?.dispatch({ effects: wrapCompartment.reconfigure(wrap.value ? EditorView.lineWrapping : []) })
}

onUnmounted(() => { view?.destroy() })
</script>

<style scoped>
.ps-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 11px;
  color: var(--field-label);
}
.ps-engine-lbl { font-weight: 600; white-space: nowrap; color: var(--field-txt); }
.ps-engine-sel {
  height: 24px;
  background: var(--field-bg);
  border: 1px solid var(--field-border);
  border-radius: 4px;
  color: var(--field-txt);
  font-size: 11px;
  font-family: 'Montserrat', sans-serif;
  padding: 0 6px;
  cursor: pointer;
}
.ps-toolbar-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.ps-wrap-label { display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 11px; color: var(--field-label); }
.ps-cursor { font-size: 10px; color: var(--field-label); white-space: nowrap; }
.cm-wrapper {
  border: 1px solid var(--field-border);
  border-radius: 6px;
  overflow: hidden;
  max-height: 320px;
  font-size: 13px;
}
.cm-wrapper :deep(.cm-editor) { max-height: 320px; overflow-y: auto; }
.cm-wrapper :deep(.cm-scroller) { overflow: auto; }
</style>
