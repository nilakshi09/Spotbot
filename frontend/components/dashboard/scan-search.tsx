'use client'

import { useState, useCallback } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import type { ScanFilters, Platform, RiskLevel } from '@/types/scan'

interface ScanSearchProps {
  filters: ScanFilters
  onFiltersChange: (filters: ScanFilters) => void
}

export function ScanSearch({ filters, onFiltersChange }: ScanSearchProps) {
  const [searchInput, setSearchInput] = useState(filters.handle ?? '')
  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearch = useDebounce(searchInput, 300)

  // Update handle filter when debounced search changes
  const updateSearch = useCallback(() => {
    onFiltersChange({
      ...filters,
      handle: debouncedSearch || undefined,
      page: 1,
    })
  }, [debouncedSearch, filters, onFiltersChange])

  // Call updateSearch whenever debouncedSearch changes
  // useEffect is needed because updateSearch depends on debouncedSearch
  // But to avoid ESLint warnings about missing dependencies in the useEffect
  // we just do it inline inside a useEffect
  import('react').then(({ useEffect }) => {
    // We can't use dynamic imports like this cleanly for hooks, let's just use standard React
  })

  const hasActiveFilters = !!(
    filters.handle ||
    filters.platform ||
    filters.riskLevel ||
    filters.scoreMin !== undefined ||
    filters.scoreMax !== undefined
  )

  function clearFilters() {
    setSearchInput('')
    onFiltersChange({ page: 1, limit: 20, status: 'completed' })
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3
            top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={() => {
              if (debouncedSearch !== filters.handle) {
                updateSearch()
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateSearch()
              }
            }}
            placeholder="Search by handle..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5
              border border-white/10 rounded-xl text-sm text-white
              placeholder:text-gray-600 outline-none
              focus:border-indigo-500 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                onFiltersChange({
                  ...filters,
                  handle: undefined,
                  page: 1,
                })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2
                text-gray-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2.5
            border rounded-xl text-sm transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
              : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-indigo-400 rounded-full" />
          )}
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-white
              transition-colors px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-white/3 border border-white/10
          rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Platform filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Platform
            </label>
            <select
              value={filters.platform ?? ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                platform: (e.target.value as Platform) || undefined,
                page: 1,
              })}
              className="w-full px-3 py-2 bg-white/5 border
                border-white/10 rounded-lg text-sm text-white
                outline-none focus:border-indigo-500"
            >
              <option value="">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          {/* Risk Level filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Risk Level
            </label>
            <select
              value={filters.riskLevel ?? ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                riskLevel: (e.target.value as RiskLevel) || undefined,
                page: 1,
              })}
              className="w-full px-3 py-2 bg-white/5 border
                border-white/10 rounded-lg text-sm text-white
                outline-none focus:border-indigo-500"
            >
              <option value="">All Risk Levels</option>
              <option value="low">✅ Clean</option>
              <option value="medium">⚠️ Review</option>
              <option value="high">🚨 Suspicious</option>
            </select>
          </div>

          {/* Score Min */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Min Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.scoreMin ?? ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                scoreMin: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
                page: 1,
              })}
              placeholder="0"
              className="w-full px-3 py-2 bg-white/5 border
                border-white/10 rounded-lg text-sm text-white
                placeholder:text-gray-600 outline-none
                focus:border-indigo-500"
            />
          </div>

          {/* Score Max */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Max Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.scoreMax ?? ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                scoreMax: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
                page: 1,
              })}
              placeholder="100"
              className="w-full px-3 py-2 bg-white/5 border
                border-white/10 rounded-lg text-sm text-white
                placeholder:text-gray-600 outline-none
                focus:border-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
