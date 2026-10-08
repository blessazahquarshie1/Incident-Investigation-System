import React, { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import EmptyState from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  sortable?: boolean
  getValue?: (row: T) => string | number // for sorting
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyMessage?: string
  showRowCount?: boolean
  totalCount?: number
}

export default function DataTable<T>({
  columns, rows, getRowKey, onRowClick, emptyMessage = 'No records found.', showRowCount, totalCount,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(col: Column<T>) {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
  }

  const sorted = React.useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find(c => c.key === sortKey)
    if (!col?.getValue) return rows
    return [...rows].sort((a, b) => {
      const av = col.getValue!(a)
      const bv = col.getValue!(b)
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortKey, sortDir, columns])

  if (sorted.length === 0) {
    return <EmptyState title={emptyMessage} />
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-[15px]">
          <thead className="bg-slate-50 text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-semibold ${col.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                  onClick={() => handleSort(col)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      sortKey === col.key
                        ? (sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)
                        : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sorted.map(row => (
              <tr
                key={getRowKey(row)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-slate-800">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showRowCount && (
        <p className="mt-2 text-[13px] text-slate-500">
          Showing {sorted.length}{totalCount !== undefined && totalCount !== sorted.length ? ` of ${totalCount}` : ''}
        </p>
      )}
    </div>
  )
}

