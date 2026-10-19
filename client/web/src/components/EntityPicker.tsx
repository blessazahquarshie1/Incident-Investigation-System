import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, Plus, X, User } from 'lucide-react'
import EntityIcon from './EntityIcon'
import type { EntityType } from '../types'

export interface EntityPickerOption {
  id: string
  label: string
  subLabel?: string
  type?: EntityType | 'officer'
}

export interface EntityPickerProps {
  id?: string
  value: string
  onChange: (id: string) => void
  options: EntityPickerOption[]
  placeholder?: string
  onCreateNew?: () => void
  createNewLabel?: string
  disabled?: boolean
  error?: boolean
}

export default function EntityPicker({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an entity…',
  onCreateNew,
  createNewLabel = '+ Create new…',
  disabled = false,
  error = false,
}: EntityPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(o => o.id === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      // Focus search input on open
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const filteredOptions = options.filter(opt => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.id.toLowerCase().includes(q) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    )
  })

  function handleSelect(optId: string) {
    onChange(optId)
    setIsOpen(false)
    setSearch('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  function renderIcon(type?: EntityType | 'officer') {
    if (!type) return null
    if (type === 'officer') {
      return <User className="h-4 w-4 text-slate-500 shrink-0" />
    }
    return <EntityIcon type={type} className="h-4 w-4 shrink-0" />
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-[14px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          error
            ? 'border-red-300 focus:border-red-500'
            : 'border-slate-300 focus:border-blue-500 hover:border-slate-400'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-slate-900'}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selectedOption ? (
            <>
              {renderIcon(selectedOption.type)}
              <span className="truncate font-medium text-slate-900">{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="truncate text-[13px] text-slate-500">({selectedOption.subLabel})</span>
              )}
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden animate-fadeIn">
          {/* Search Header */}
          <div className="border-b border-slate-100 p-2">
            <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-[13px] text-slate-500">
                No matching options found.
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = opt.id === value
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {renderIcon(opt.type)}
                      <div className="truncate">
                        <span className="text-slate-900">{opt.label}</span>
                        {opt.subLabel && (
                          <span className="ml-1.5 text-slate-400 text-[13px] font-mono">
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2" />}
                  </button>
                )
              })
            )}
          </div>

          {/* Optional Create New Option */}
          {onCreateNew && (
            <div className="border-t border-slate-100 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onCreateNew()
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold text-blue-600 hover:bg-blue-100/50 hover:text-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{createNewLabel}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
