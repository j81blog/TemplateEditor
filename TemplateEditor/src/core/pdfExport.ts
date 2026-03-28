import type { TemplateDocument, TemplateItem, OsDefinition } from './types'

function esc(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const CHECK_SVG = `<svg class="chk" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <path d="M2.5 8.5 L6.5 12.5 L13.5 4" stroke="#16a34a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`

const EMPTY_SVG = `<svg class="chk chk-off" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="7" fill="none" stroke="#d1d5db" stroke-width="1.2"/>
</svg>`

function check(on: boolean | undefined): string {
  if (on === undefined) return ''
  return on ? CHECK_SVG : EMPTY_SVG
}

function itemRows(item: TemplateItem, osList: OsDefinition[], shade: boolean): string {
  // Only show OS entries that are mapped to this item, in the order of osList
  const mappedOs = osList.filter(o => o.tag in item.os)
  if (mappedOs.length === 0) {
    return `<tr class="${shade ? 'shade' : ''}">
      <td class="name-cell">
        <div class="item-name">${esc(item.name || '(unnamed)')}</div>
        ${item.description ? `<div class="item-desc">${esc(item.description)}</div>` : ''}
      </td>
      <td class="type-cell"><span class="type-badge">${esc(item.type)}</span></td>
      <td class="cat-cell">${esc(item.category)}</td>
      <td></td><td></td><td></td><td></td>
    </tr>`
  }

  const span = mappedOs.length
  return mappedOs.map((os, i) => {
    const m = item.os[os.tag]
    const firstRow = i === 0
    const rowClass = shade ? 'shade' : ''
    const borderClass = i === span - 1 ? ' last-os-row' : ''
    return `<tr class="${rowClass}${borderClass}">
      ${firstRow ? `
        <td class="name-cell" rowspan="${span}">
          <div class="item-name">${esc(item.name || '(unnamed)')}</div>
          ${item.description ? `<div class="item-desc">${esc(item.description)}</div>` : ''}
        </td>
        <td class="type-cell" rowspan="${span}"><span class="type-badge">${esc(item.type)}</span></td>
        <td class="cat-cell" rowspan="${span}">${esc(item.category)}</td>
      ` : ''}
      <td class="os-cell">${esc(os.abbreviation || os.name)}</td>
      <td class="check-cell">${check(m?.execute)}</td>
      <td class="check-cell">${check(m?.physical)}</td>
      <td class="check-cell">${check(m?.virtual)}</td>
    </tr>`
  }).join('')
}

function categoryRow(label: string): string {
  return `<tr class="cat-hdr"><td colspan="7">${esc(label)}</td></tr>`
}

function buildHtml(doc: TemplateDocument, osList: OsDefinition[], items: TemplateItem[], sortBy: string): string {
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  let rows = ''
  if (sortBy === 'category') {
    let currentCat = ''
    let shade = false
    for (const item of items) {
      if (item.category !== currentCat) {
        currentCat = item.category
        rows += categoryRow(currentCat)
        shade = false
      }
      rows += itemRows(item, osList, shade)
      shade = !shade
    }
  } else {
    items.forEach((item, i) => { rows += itemRows(item, osList, i % 2 === 1) })
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Template Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         font-size: 11px; color: #1e293b; margin: 0; padding: 14px; }

  /* Report header */
  .report-header { display: flex; align-items: baseline; justify-content: space-between;
                   margin-bottom: 16px; border-bottom: 2px solid #1e3a6e; padding-bottom: 8px; }
  .report-title { font-size: 20px; font-weight: 700; color: #1e3a6e; }
  .report-date  { font-size: 10px; color: #94a3b8; }

  /* Table */
  table { width: 100%; border-collapse: collapse; }

  thead th { background: #1e3a6e; color: #fff; padding: 9px 12px;
             font-size: 10px; font-weight: 600; text-align: left;
             letter-spacing: 0.3px; white-space: nowrap; }
  thead th.center { text-align: center; }

  /* Item rows */
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr.shade { background: #f8fafc; }
  tbody tr.last-os-row { border-bottom: 2px solid #e2e8f0; }
  tbody tr.cat-hdr td { background: #334155; color: #e2e8f0; font-weight: 700;
                         font-size: 10px; padding: 6px 12px; letter-spacing: 0.4px; }

  td { padding: 4px 10px; vertical-align: middle; }

  /* Name / description column */
  .name-cell { vertical-align: top; padding-top: 9px; min-width: 200px; }
  .item-name { font-weight: 700; font-size: 11px; color: #1e293b; line-height: 1.3; }
  .item-desc { font-size: 9px; color: #64748b; margin-top: 3px; font-style: italic; line-height: 1.4; }

  /* Type badge */
  .type-cell { vertical-align: middle; white-space: nowrap; }
  .type-badge { display: inline-block; font-size: 9px; font-weight: 600;
                background: #eff6ff; color: #1d4ed8;
                border: 1px solid #bfdbfe; border-radius: 4px;
                padding: 2px 7px; white-space: nowrap; }

  /* Category */
  .cat-cell { font-size: 10px; color: #475569; vertical-align: middle; }

  /* OS column */
  .os-cell { font-size: 9px; font-weight: 600; color: #334155;
             white-space: nowrap; padding: 2px 10px; }

  /* Checkmark columns */
  .check-cell { text-align: center; padding: 2px 8px; }
  .chk { width: 15px; height: 15px; display: inline-block; vertical-align: middle; }
  .chk-off { opacity: 0.5; }

  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="report-header">
    <span class="report-title">Template Report</span>
    <span class="report-date">${date}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:45%">Name / Description</th>
        <th style="width:100px">Type</th>
        <th style="width:80px">Category</th>
        <th style="width:65px">OS</th>
        <th class="center" style="width:70px">Execute</th>
        <th class="center" style="width:70px">Physical</th>
        <th class="center" style="width:70px">Virtual</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
}

export async function exportPdf(
  doc: TemplateDocument,
  osTags: string[],
  sortBy: 'name' | 'order' | 'category'
): Promise<void> {
  const osList = osTags.length
    ? doc.supportedOs.filter(o => osTags.includes(o.tag))
    : doc.supportedOs

  const sorted = [...doc.items].sort((a, b) => {
    if (sortBy === 'order')    return (a.order - b.order) || a.name.localeCompare(b.name)
    if (sortBy === 'category') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    return a.name.localeCompare(b.name)
  })

  const html = buildHtml(doc, osList, sorted, sortBy)
  const win = window.open('', '_blank')
  if (!win) { alert('Please allow pop-ups to generate the report.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}
