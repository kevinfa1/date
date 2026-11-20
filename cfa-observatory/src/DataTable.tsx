import type { ReactNode } from 'react'

export type Column<R> = {
  id: string
  header: ReactNode
  csvHeader?: string
  align?: 'left' | 'right'
  cell: (row: R, index: number) => ReactNode
  csv?: (row: R) => string | number | null | undefined
}

type Props<R> = {
  columns: Column<R>[]
  rows: R[]
  rowKey: (row: R, index: number) => string
  ariaLabel: string
  csvName?: string
  csvLabel?: string
}

function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'number' ? (Number.isFinite(v) ? String(v) : '') : v
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv<R>(name: string, columns: Column<R>[], rows: R[]) {
  const cols = columns.filter((c) => c.csv)
  const head = cols.map((c) => csvCell(c.csvHeader ?? (typeof c.header === 'string' ? c.header : c.id))).join(',')
  const body = rows.map((r) => cols.map((c) => csvCell(c.csv!(r))).join(','))
  const blob = new Blob(['\uFEFF' + [head, ...body].join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DataTable<R>({ columns, rows, rowKey, ariaLabel, csvName, csvLabel }: Props<R>) {
  return (
    <div className="data-table-block">
      <div className="table-wrap">
        <table aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.id} className={c.align === 'right' ? 'num' : undefined}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={rowKey(r, i)}>
                {columns.map((c) => (
                  <td key={c.id} className={c.align === 'right' ? 'num' : undefined}>
                    {c.cell(r, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {csvName && (
        <div className="table-actions">
          <button type="button" className="btn btn-secondary" onClick={() => downloadCsv(csvName, columns, rows)}>
            {csvLabel ?? 'Export CSV'}
          </button>
        </div>
      )}
    </div>
  )
}
