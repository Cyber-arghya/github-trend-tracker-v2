import React from 'react'
import { Filter, Code2, Clock, Search, Heart } from 'lucide-react'
import { HistoricalDateSelector } from '../HistoricalDateSelector'
import type { TimeFilter } from '../../types'

export interface TableFiltersProps {
  timeFilter: TimeFilter
  effectiveDate: string
  availableDates: string[]
  totalTrackedCount: number
  lastUpdatedFormatted?: { display: string; full: string }
  effectiveLastUpdated?: string | null
  timeCounts: Record<string, number>
  searchQuery: string
  onSearchChange: (q: string) => void
  onTimeFilterChange: (filter: TimeFilter) => void
  onDateChange: (date: string) => void
  allCategories: string[]
  categoryFilter: string
  categoryCounts: Record<string, number>
  onCategoryClick: (cat: string) => void
  allLanguages: string[]
  languageFilter: string
  languageCounts: Record<string, number>
  onLanguageClick: (lang: string) => void
  favoriteIdsCount: number
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  timeFilter,
  effectiveDate,
  availableDates,
  totalTrackedCount,
  lastUpdatedFormatted,
  effectiveLastUpdated,
  timeCounts,
  searchQuery,
  onSearchChange,
  onTimeFilterChange,
  onDateChange,
  allCategories,
  categoryFilter,
  categoryCounts,
  onCategoryClick,
  allLanguages,
  languageFilter,
  languageCounts,
  onLanguageClick,
  favoriteIdsCount,
}) => {
  return (
    <div className="bg-neutral-900/95 border-b border-neutral-800 p-2 sm:p-3 space-y-2 rounded-t-xl">
      {/* Row 1: Time Filters + Date Selector + Last Updated + Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800 shrink-0">
            {(
              [
                { id: 'all', label: 'All-Time' },
                { id: 'daily', label: 'Today (Daily)' },
                { id: 'weekly', label: 'This Week' },
                { id: 'monthly', label: 'This Month' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => onTimeFilterChange(item.id)}
                className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  timeFilter === item.id
                    ? 'bg-primary-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    timeFilter === item.id
                      ? 'bg-primary-600 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {timeCounts[item.id] || 0}
                </span>
              </button>
            ))}

            {/* Top Bar Favorites Pill */}
            <button
              data-testid="favorites-pill"
              onClick={() => onTimeFilterChange('favorites')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                timeFilter === 'favorites'
                  ? 'bg-rose-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/60'
              }`}
              title="View your saved favorite repositories"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  timeFilter === 'favorites'
                    ? 'fill-neutral-950 text-neutral-950'
                    : favoriteIdsCount > 0
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-neutral-400'
                }`}
              />
              <span className="hidden xs:inline">Favorites</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  timeFilter === 'favorites'
                    ? 'bg-rose-600 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {favoriteIdsCount}
              </span>
            </button>
          </div>

          {/* Historical Date Selector Dropdown */}
          <HistoricalDateSelector
            timeFilter={timeFilter}
            effectiveDate={effectiveDate}
            availableDates={availableDates}
            totalTrackedCount={totalTrackedCount}
            onDateChange={onDateChange}
          />

          {/* Last Updated Timestamp Indicator */}
          {effectiveLastUpdated && lastUpdatedFormatted && (
            <div
              data-testid="last-updated-pill"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 shrink-0 select-none shadow-sm hover:border-neutral-700 transition-colors"
              title={lastUpdatedFormatted.full}
            >
              <Clock className="w-3.5 h-3.5 text-primary-400 shrink-0" />
              <span className="text-neutral-400 font-medium">Last updated:</span>
              <strong className="text-neutral-200 font-mono font-semibold">
                {lastUpdatedFormatted.display}
              </strong>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search repo, tech stack, or problem..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Row 2: Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 text-xs scrollbar-none">
        <span className="text-neutral-400 text-[11px] font-semibold shrink-0 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-primary-400" />
          Category:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {/* All Pill */}
          <button
            type="button"
            onClick={() => onCategoryClick('all')}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              categoryFilter === 'all'
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50 font-bold'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-70 font-mono">({categoryCounts['all'] || 0})</span>
          </button>

          {/* Dedicated Category Favorites Pill */}
          <button
            type="button"
            data-testid="category-fav-pill"
            onClick={() => onCategoryClick('favorites')}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              categoryFilter === 'favorites'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 font-bold shadow-sm shadow-rose-500/20'
                : favoriteIdsCount === 0
                ? 'bg-neutral-950/40 text-neutral-600 border border-neutral-800/40 hover:text-neutral-400'
                : 'bg-neutral-950 text-neutral-300 hover:text-rose-300 hover:bg-neutral-800 border border-neutral-800'
            }`}
            title="Filter to show only your saved favorite repositories"
          >
            <Heart
              className={`w-3 h-3 ${
                categoryFilter === 'favorites' || (categoryCounts['favorites'] || 0) > 0
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-neutral-400'
              }`}
            />
            <span>Favorites</span>
            <span className="text-[10px] font-mono opacity-80">({categoryCounts['favorites'] || 0})</span>
          </button>

          {/* Architecture Category Pills */}
          {allCategories
            .filter((c) => c !== 'all')
            .map((cat) => {
              const count = categoryCounts[cat] || 0
              const isActive = categoryFilter === cat
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryClick(cat)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50 font-bold'
                      : count === 0
                      ? 'bg-neutral-950/40 text-neutral-600 border border-neutral-800/40 hover:text-neutral-400'
                      : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-70 font-mono">({count})</span>
                </button>
              )
            })}
        </div>
      </div>

      {/* Row 3: Language Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 text-xs border-t border-neutral-800/60 scrollbar-none">
        <span className="text-neutral-400 text-[11px] font-semibold shrink-0 flex items-center gap-1 mr-1">
          <Code2 className="w-3 h-3 text-primary-400" />
          Language:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {allLanguages.map((lang) => {
            const count = languageCounts[lang] || 0
            const isActive = languageFilter === lang
            return (
              <button
                key={lang}
                onClick={() => onLanguageClick(lang)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50 font-bold'
                    : count === 0
                    ? 'bg-neutral-950/40 text-neutral-600 border border-neutral-800/40 hover:text-neutral-400'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>{lang === 'all' ? 'All Languages' : lang}</span>
                <span className="text-[10px] opacity-70 font-mono">({count})</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

