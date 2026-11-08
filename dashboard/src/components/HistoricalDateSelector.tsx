import React from 'react'
import { Calendar } from 'lucide-react'
import type { TimePeriodFilter } from '../types'

export interface HistoricalDateSelectorProps {
  timeFilter: TimePeriodFilter
  effectiveDate: string
  availableDates: string[]
  totalTrackedCount: number
  onDateChange: (selectedDate: string) => void
}

export const HistoricalDateSelector: React.FC<HistoricalDateSelectorProps> = ({
  timeFilter,
  effectiveDate,
  availableDates,
  totalTrackedCount,
  onDateChange,
}) => {
  if (timeFilter === 'all') {
    return (
      <div
        data-testid="all-history-badge"
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950/60 rounded-lg border border-neutral-800/80 shrink-0 text-xs text-neutral-500 select-none"
        title="Viewing cumulative all-time performance ranking"
      >
        <Calendar className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
        <span className="text-[11px] font-mono text-neutral-400">
          All History ({totalTrackedCount} Repos)
        </span>
      </div>
    )
  }

  const hasDates = availableDates.length > 0

  return (
    <div
      data-testid="historical-date-selector-container"
      className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950 rounded-lg border border-primary-500/50 shadow-sm shadow-primary-500/10 shrink-0 text-xs transition-all hover:border-primary-400"
    >
      <Calendar className="w-3.5 h-3.5 text-primary-400 shrink-0" />
      <label htmlFor="snapshot-date-select" className="text-[11px] text-neutral-400 font-medium hidden sm:inline">
        Date:
      </label>
      <select
        id="snapshot-date-select"
        data-testid="historical-date-select"
        value={effectiveDate}
        disabled={!hasDates}
        onChange={(event) => onDateChange(event.target.value)}
        className="bg-transparent text-xs font-mono font-bold text-neutral-100 focus:outline-none cursor-pointer pr-1 disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Choose historical ${timeFilter} snapshot date`}
      >
        {hasDates ? (
          availableDates.map((dateString, index) => (
            <option
              key={dateString}
              value={dateString}
              className="bg-neutral-900 text-neutral-100 py-1"
            >
              {dateString} {index === 0 ? '(Latest)' : ''}
            </option>
          ))
        ) : (
          <option value="" disabled className="bg-neutral-900 text-neutral-400">
            No snapshots recorded
          </option>
        )}
      </select>
    </div>
  )
}

