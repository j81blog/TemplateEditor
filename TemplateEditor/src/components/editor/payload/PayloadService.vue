<template>
  <div class="card">
    <div class="card-hdr">
      <div class="c-accent" style="background:#38bdf8"></div>
      <span class="c-label">Service</span>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="fg">
          <div class="field">
            <label class="field-lbl">Service Name *</label>
            <input class="field-inp" :value="p.name" @input="emit('update', { name: ($event.target as HTMLInputElement).value })" placeholder="e.g. wuauserv" />
          </div>
        </div>
        <div style="flex:1">
          <div class="field">
            <label class="field-lbl">Action *</label>
            <select class="field-inp" :value="p.action" @change="emit('update', { action: ($event.target as HTMLSelectElement).value })">
              <option>Disabled</option><option>Automatic</option><option>Manual</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TemplateItem, ServicePayload } from '../../../core/types'

const props = defineProps<{ item: TemplateItem }>()
const emit = defineEmits<{ update: [patch: Partial<ServicePayload>] }>()
const p = computed(() => props.item.payload as ServicePayload)
</script>
