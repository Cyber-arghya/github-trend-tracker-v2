import React, { useState } from 'react'
import type { UnifiedRepoItem, TrendingSnapshotItem, TimeFilter } from '../types'
import { useRepoFilters } from '../hooks/useRepoFilters'
import { TableFilters } from './table/TableFilters'
import { TableHeader } from './table/TableHeader'
import { RepoTableRow } from './table/RepoTableRow'
import { RepoMobileCard } from './table/RepoMobileCard'
import { TableEmptyState } from './table/TableEmptyState'

export interface UnifiedTableViewProps {
  repos: UnifiedRepoItem[]
  snapshots?: TrendingSnapshotItem[]
  lastUpdatedIso?: string
  timeFilter?: TimeFilter
  onTimeFilterChange?: (filter: TimeFilter) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (repoId: string) => void
  isLoading?: boolean
}

export const UnifiedTableView: React.FC<UnifiedTableViewProps> = ({
  repos,
  snapshots = [],
  lastUpdatedIso,
  timeFilter: controlledTimeFilter,
  onTimeFilterChange,
  favoriteIds: controlledFavoriteIds,
  onToggleFavorite,
  isLoading = false,
}) => {
  const [internalTimeFilter, setInternalTimeFilter] = useState<TimeFilter>('all')
  const effectiveTimeFilter = controlledTimeFilter !== undefined ? controlledTimeFilter : internalTimeFilter

  const [localFavoriteIds, setLocalFavoriteIds] = useState<Set<string>>(() => new Set())
  const effectiveFavoriteIds = controlledFavoriteIds !== undefined ? controlledFavoriteIds : localFavoriteIds

  const handleToggleFavorite = (repoId: string) => {
    if (onToggleFavorite) {
      onToggleFavorite(repoId)
    } else {
      setLocalFavoriteIds((prev) => {
        const next = new Set(prev)
        if (next.has(repoId)) next.delete(repoId)
        else next.add(repoId)
        return next
      })
    }
  }

  const {
    setSelectedDate,
    categoryFilter,
    languageFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    sortAsc,
    expandedRepoId,
    copiedId,
    availableDatesForPeriod,
    effectiveDate,
    effectiveLastUpdated,
    lastUpdatedFormatted,
    allCategories,
    allLanguages,
    maxObservedScore,
    timeCounts,
    categoryCounts,
    languageCounts,
    filteredRepos,
    handleCategoryClick,
    handleLanguageClick,
    handleTimeFilterChange,
    handleResetFilters,
    toggleSort,
    toggleExpand,
    handleCopy,
  } = useRepoFilters({
    repos,
    snapshots,
    lastUpdatedIso,
    timeFilter: effectiveTimeFilter,
    favoriteIds: effectiveFavoriteIds,
    onTimeFilterChange: (filter) => {
      setInternalTimeFilter(filter)
      onTimeFilterChange?.(filter)
    },
  })

  return (
    <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-md">
      {/* ─── Top Filter Zone ─── */}
      <TableFilters
        timeFilter={effectiveTimeFilter}
        effectiveDate={effectiveDate}
        availableDates={availableDatesForPeriod}
        totalTrackedCount={effectiveTimeFilter === 'favorites' ? effectiveFavoriteIds.size : repos.length}
        lastUpdatedFormatted={lastUpdatedFormatted}
        effectiveLastUpdated={effectiveLastUpdated}
        timeCounts={timeCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onTimeFilterChange={handleTimeFilterChange}
        onDateChange={setSelectedDate}
        allCategories={allCategories}
        categoryFilter={categoryFilter}
        categoryCounts={categoryCounts}
        onCategoryClick={handleCategoryClick}
        allLanguages={allLanguages}
        languageFilter={languageFilter}
        languageCounts={languageCounts}
        onLanguageClick={handleLanguageClick}
        favoriteIdsCount={effectiveFavoriteIds.size}
      />

      {/* ─── Mobile View: Optimized Card Layout (< 640px) ─── */}
      <div className="block sm:hidden p-2 space-y-2.5">
        {filteredRepos.length > 0 ? (
          filteredRepos.map((row) => (
            <RepoMobileCard
              key={row.repo_id}
              row={row}
              timeFilter={effectiveTimeFilter}
              effectiveDate={effectiveDate}
              isExpanded={expandedRepoId === row.repo_id}
              isFavorite={effectiveFavoriteIds.has(row.repo_id)}
              maxObservedScore={maxObservedScore}
              copiedId={copiedId}
              onToggleExpand={toggleExpand}
              onToggleFavorite={handleToggleFavorite}
              onCopy={handleCopy}
            />
          ))
        ) : (
          <TableEmptyState
            isLoading={isLoading}
            totalReposCount={repos.length}
            timeFilter={effectiveTimeFilter}
            categoryFilter={categoryFilter}
            filteredCount={filteredRepos.length}
            favoritesCount={effectiveFavoriteIds.size}
            onResetFilters={handleResetFilters}
            onShowAll={() => handleTimeFilterChange('all')}
            isTableContext={false}
          />
        )}
      </div>

      {/* ─── Desktop & Tablet View: Responsive HTML Table (sm+) ─── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-300">
          <TableHeader sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
          <tbody className="divide-y divide-neutral-800/60">
            {filteredRepos.length > 0 ? (
              filteredRepos.map((row) => (
                <RepoTableRow
                  key={row.repo_id}
                  row={row}
                  timeFilter={effectiveTimeFilter}
                  effectiveDate={effectiveDate}
                  isExpanded={expandedRepoId === row.repo_id}
                  isFavorite={effectiveFavoriteIds.has(row.repo_id)}
                  maxObservedScore={maxObservedScore}
                  copiedId={copiedId}
                  onToggleExpand={toggleExpand}
                  onToggleFavorite={handleToggleFavorite}
                  onCopy={handleCopy}
                />
              ))
            ) : (
              <TableEmptyState
                isLoading={isLoading}
                totalReposCount={repos.length}
                timeFilter={effectiveTimeFilter}
                categoryFilter={categoryFilter}
                filteredCount={filteredRepos.length}
                favoritesCount={effectiveFavoriteIds.size}
                onResetFilters={handleResetFilters}
                onShowAll={() => handleTimeFilterChange('all')}
                isTableContext={true}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
