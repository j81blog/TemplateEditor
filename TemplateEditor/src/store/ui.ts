import { reactive } from 'vue'
import type { ViewMode, SortDir, UiFilters } from '../core/types'

export const uiStore = reactive({
  selectedId: null as string | null,
  viewMode: 'category' as ViewMode,
  sortDir: 'asc' as SortDir,
  filters: { search: '', category: '', type: '', os: '' } as UiFilters,

  select(id: string | null) { this.selectedId = id },
  setViewMode(mode: ViewMode) { this.viewMode = mode },
  toggleSort() { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc' },
  setFilter(key: keyof UiFilters, value: string) { this.filters[key] = value },
  resetFilters() { this.filters = { search: '', category: '', type: '', os: '' } }
})
