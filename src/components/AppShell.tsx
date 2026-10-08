import React, { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, AlertTriangle, Users, FileSearch,
  Car, MapPin, Clock, Network, ShieldCheck, FileBarChart,
  Search, Shield,
} from 'lucide-react'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph } from '../lib/graph'
import { searchAll, getResultPath } from '../lib/search'
import EntityIcon from './EntityIcon'
import type { SearchResult } from '../lib/search'
import type { EntityType } from '../types'

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Cases', path: '/cases', icon: Briefcase },
  { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
  { name: 'Persons', path: '/persons', icon: Users },
  { name: 'Evidence', path: '/evidence', icon: FileSearch },
  { name: 'Vehicles', path: '/vehicles', icon: Car },
  { name: 'Locations', path: '/locations', icon: MapPin },
  { name: 'Timeline', path: '/timeline', icon: Clock },
  { name: 'Relationship Graph', path: '/graph', icon: Network },
  { name: 'Investigators', path: '/investigators', icon: ShieldCheck },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
]

export default function AppShell() {
  const data = useInvestigationStore(s => s.data)
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search: 200ms delay
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value
      setSearchQuery(q)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (q.trim().length >= 2) {
          const graph = buildGraph(data)
          const results = searchAll(data, graph, q).slice(0, 6)
          setSearchResults(results)
          setShowDropdown(true)
        } else {
          setSearchResults([])
          setShowDropdown(false)
        }
      }, 200)
    },
    [data]
  )

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      setShowDropdown(false)
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
    if (e.key === 'Escape') setShowDropdown(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[17px] font-semibold leading-tight text-slate-900">
              Incident Investigation System
            </p>
            <p className="text-[13px] text-slate-500">Intelligence &amp; Case Management</p>
          </div>
        </div>

        {/* Search box with live dropdown */}
        <div ref={searchRef} className="relative w-64 md:w-80 lg:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
            placeholder="Search cases, persons, plates…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-base text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {searchResults.map(result => (
                <button
                  key={`${result.entityType}-${result.id}`}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                  onClick={() => {
                    setShowDropdown(false)
                    setSearchQuery('')
                    navigate(getResultPath(result))
                  }}
                >
                  {result.entityType !== 'case' && (
                    <EntityIcon type={result.entityType as EntityType} className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  {result.entityType === 'case' && (
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-slate-900">{result.title}</p>
                    <p className="truncate text-[13px] text-slate-500">{result.subtitle}</p>
                  </div>
                </button>
              ))}
              <button
                className="flex w-full items-center justify-center border-t border-slate-100 px-4 py-2 text-[13px] text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  setShowDropdown(false)
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                }}
              >
                See all results for &ldquo;{searchQuery}&rdquo;
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="shrink-0 border-r border-slate-200 bg-white w-14 lg:w-64 transition-all">
          <nav className="flex h-full flex-col justify-between p-2 lg:p-4">
            <div className="space-y-0.5">
              {navItems.map(item => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-base font-medium transition-colors duration-100 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-400'}`}
                        />
                        <span className="hidden truncate lg:block">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
            <div className="hidden border-t border-slate-200 pt-3 text-[13px] text-slate-400 lg:block">
              <p>v0.1.0 — Development</p>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
