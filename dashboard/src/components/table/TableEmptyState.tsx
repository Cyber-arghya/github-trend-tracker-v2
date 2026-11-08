import React from 'react'
import { Heart, RotateCcw } from 'lucide-react'
import type { TimeFilter } from '../../types'

export interface TableEmptyStateProps {
  isLoading: boolean
  totalReposCount: number
  timeFilter: TimeFilter
  categoryFilter: string
  filteredCount: number
  favoritesCount: number
  onResetFilters: () => void
  onShowAll: () => void
  isTableContext?: boolean
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  isLoading,
  totalReposCount,
  timeFilter,
  categoryFilter,
  filteredCount,
  favoritesCount,
  onResetFilters,
  onShowAll,
  isTableContext = true,
}) => {
  let content: React.ReactNode = null

  if (isLoading && totalReposCount === 0) {
    content = (
      <div className="py-16 text-center text-neutral-500">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
          <span>Loading trending repositories...</span>
        </div>
      </div>
    )
  } else if (
    (timeFilter === 'favorites' || categoryFilter === 'favorites') &&
    filteredCount === 0 &&
    favoritesCount === 0
  ) {
    content = (
      <div className="py-16 text-center text-neutral-400">
        <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto p-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-200">No favorite repositories yet</h3>
            <p className="text-xs text-neutral-400">
              Hover over any repository row or card and click the heart icon to add it to your personal favorites list.
            </p>
          </div>
          <button
            onClick={onShowAll}
            className="mt-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
          >
            Browse All Repositories
          </button>
        </div>
      </div>
    )
  } else if (filteredCount === 0) {
    content = (
      <div className="py-12 text-center text-neutral-500">
        <div className="flex flex-col items-center justify-center gap-2.5 p-4">
          <p className="text-xs sm:text-sm">No repositories found matching your filter criteria.</p>
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      </div>
    )
  }

  if (!content) return null

  if (isTableContext) {
    return (
      <tr>
        <td colSpan={12} className="px-4">
          {content}
        </td>
      </tr>
    )
  }

  return <div>{content}</div>
}
