import { X } from 'lucide-react'

export interface FilterOption { value: string; label: string }

export interface FilterDef {
  key: string
  label: string
  value: string
  options: FilterOption[]
  onChange: (v: string) => void
}

interface FilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  filters: FilterDef[]
  onClear: () => void
}

export default function FilterBar({
  search, onSearchChange, searchPlaceholder = 'Search…', filters, onClear
}: FilterBarProps) {
  const hasActive = search !== '' || filters.some(f => f.value !== '')

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[200px]"
      />
      {filters.map(f => (
        <select
          key={f.key}
          value={f.value}
          onChange={e => f.onChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label={f.label}
        >
          <option value="">{f.label}</option>
          {f.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      {hasActive && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  )
}

