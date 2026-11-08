import { useState, useMemo, useCallback } from 'react'
import type { UnifiedRepoItem, TrendingSnapshotItem, TimeFilter, SortOption } from '../types'
import {
  extractAvailableSnapshotDates,
  resolveEffectiveSnapshotDate,
  resolveHistoricalSnapshotItems,
  calculateCoordinatedTimePeriodCounts,
  formatLastUpdated,
} from '../lib/timeTravelResolver'

export interface UseRepoFiltersProps {
  repos: UnifiedRepoItem[]
  snapshots: TrendingSnapshotItem[]
  lastUpdatedIso?: string
  timeFilter: TimeFilter
  favoriteIds: Set<string>
  onTimeFilterChange?: (filter: TimeFilter) => void
}

export function useRepoFilters({
  repos,
  snapshots,
  lastUpdatedIso,
  timeFilter,
  favoriteIds,
  onTimeFilterChange,
}: UseRepoFiltersProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('rank')
  const [sortAsc, setSortAsc] = useState<boolean>(true)
  const [expandedRepoId, setExpandedRepoId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 1. Available snapshot dates for period
  const availableDatesForPeriod = useMemo(
    () => extractAvailableSnapshotDates(snapshots, timeFilter),
    [snapshots, timeFilter]
  )

  // 2. Effective snapshot date
  const effectiveDate = useMemo(
    () => resolveEffectiveSnapshotDate(selectedDate, availableDatesForPeriod),
    [selectedDate, availableDatesForPeriod]
  )

  // 3. Base repos resolution (Historical or Favorites view)
  const baseRepos = useMemo(() => {
    if (timeFilter === 'favorites') {
      return repos.filter((r) => favoriteIds.has(r.repo_id))
    }
    return resolveHistoricalSnapshotItems(repos, snapshots, timeFilter, effectiveDate)
  }, [repos, snapshots, timeFilter, effectiveDate, favoriteIds])

  // 4. Formatted Last Updated text
  const effectiveLastUpdated = useMemo(() => {
    if (lastUpdatedIso) return lastUpdatedIso
    if (snapshots && snapshots.length > 0) {
      let maxTime = ''
      for (const s of snapshots) {
        if (s.recorded_at && (!maxTime || s.recorded_at > maxTime)) {
          maxTime = s.recorded_at
        }
      }
      return maxTime || null
    }
    return null
  }, [lastUpdatedIso, snapshots])

  const lastUpdatedFormatted = useMemo(
    () => formatLastUpdated(effectiveLastUpdated),
    [effectiveLastUpdated]
  )

  // 5. Distinct categories & languages
  const allCategories = useMemo(() => {
    const set = new Set<string>()
    repos.forEach((r) => {
      set.add(r.ai_specs?.architecture_type || 'Full-Stack App')
    })
    return ['all', ...Array.from(set)]
  }, [repos])

  const allLanguages = useMemo(() => {
    const set = new Set<string>()
    repos.forEach((r) => {
      if (r.language) set.add(r.language)
    })
    return ['all', ...Array.from(set)]
  }, [repos])

  const maxObservedScore = useMemo(() => {
    if (repos.length === 0) return 100
    return Math.max(...repos.map((r) => r.trending_power_score || 0), 100)
  }, [repos])

  // 6. Coordinated period counts
  const timeCounts = useMemo(
    () =>
      calculateCoordinatedTimePeriodCounts(
        repos,
        snapshots,
        timeFilter,
        effectiveDate,
        favoriteIds.size
      ),
    [repos, snapshots, timeFilter, effectiveDate, favoriteIds.size]
  )

  // 7. Coordinated category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, favorites: 0 }
    allCategories.forEach((c) => {
      counts[c] = 0
    })

    const matching = baseRepos.filter((r) => {
      if (languageFilter !== 'all' && r.language !== languageFilter) return false
      return true
    })

    counts.all = matching.length
    counts.favorites = matching.filter((r) => favoriteIds.has(r.repo_id)).length

    matching.forEach((r) => {
      const cat = r.ai_specs?.architecture_type || 'Full-Stack App'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [baseRepos, languageFilter, allCategories, favoriteIds])

  // 8. Coordinated language counts
  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    allLanguages.forEach((l) => {
      counts[l] = 0
    })

    const matching = baseRepos.filter((r) => {
      if (categoryFilter === 'favorites') {
        if (!favoriteIds.has(r.repo_id)) return false
      } else if (
        categoryFilter !== 'all' &&
        (r.ai_specs?.architecture_type || 'Full-Stack App') !== categoryFilter
      ) {
        return false
      }
      return true
    })

    counts.all = matching.length
    matching.forEach((r) => {
      if (r.language) {
        counts[r.language] = (counts[r.language] || 0) + 1
      }
    })
    return counts
  }, [baseRepos, categoryFilter, allLanguages, favoriteIds])

  // Filter actions
  const handleCategoryClick = useCallback(
    (cat: string) => {
      if (categoryFilter === cat) {
        setCategoryFilter('all')
        return
      }
      if (cat !== 'all' && cat !== 'favorites' && languageFilter !== 'all') {
        const hasMatch = baseRepos.some(
          (r) =>
            (r.ai_specs?.architecture_type || 'Full-Stack App') === cat &&
            r.language === languageFilter
        )
        if (!hasMatch) {
          setLanguageFilter('all')
        }
      }
      setCategoryFilter(cat)
    },
    [categoryFilter, languageFilter, baseRepos]
  )

  const handleLanguageClick = useCallback(
    (lang: string) => {
      if (languageFilter === lang) {
        setLanguageFilter('all')
        return
      }
      if (lang !== 'all' && categoryFilter !== 'all') {
        const hasMatch = baseRepos.some(
          (r) =>
            r.language === lang &&
            (categoryFilter === 'favorites'
              ? favoriteIds.has(r.repo_id)
              : (r.ai_specs?.architecture_type || 'Full-Stack App') === categoryFilter)
        )
        if (!hasMatch) {
          setCategoryFilter('all')
        }
      }
      setLanguageFilter(lang)
    },
    [languageFilter, categoryFilter, baseRepos, favoriteIds]
  )

  const handleTimeFilterChange = useCallback(
    (filter: TimeFilter) => {
      onTimeFilterChange?.(filter)
      setSelectedDate('')
    },
    [onTimeFilterChange]
  )

  const handleResetFilters = useCallback(() => {
    handleTimeFilterChange('all')
    setSelectedDate('')
    setCategoryFilter('all')
    setLanguageFilter('all')
    setSearchQuery('')
  }, [handleTimeFilterChange])

  const toggleSort = useCallback(
    (field: SortOption) => {
      if (sortBy === field) {
        setSortAsc(!sortAsc)
      } else {
        setSortBy(field)
        setSortAsc(field === 'rank' || field === 'peak')
      }
    },
    [sortBy, sortAsc]
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedRepoId((prev) => (prev === id ? null : id))
  }, [])

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  // 9. Filtered and Sorted Repository List
  const filteredRepos = useMemo(() => {
    let cleanQuery = searchQuery.trim().toLowerCase()
    cleanQuery = cleanQuery.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')

    const result = baseRepos.filter((r) => {
      if (categoryFilter === 'favorites') {
        if (!favoriteIds.has(r.repo_id)) return false
      } else if (categoryFilter !== 'all') {
        const cat = r.ai_specs?.architecture_type || 'Full-Stack App'
        if (cat !== categoryFilter) return false
      }

      if (languageFilter !== 'all' && r.language !== languageFilter) return false

      if (cleanQuery !== '') {
        const matchName = r.repo_name.toLowerCase().includes(cleanQuery)
        const matchDesc = (r.description || '').toLowerCase().includes(cleanQuery)
        const matchProp = (r.ai_specs?.key_value_proposition || '').toLowerCase().includes(cleanQuery)
        const matchTech = (r.ai_specs?.tech_stack || []).some((t) =>
          t.toLowerCase().includes(cleanQuery)
        )
        if (!matchName && !matchDesc && !matchProp && !matchTech) return false
      }

      return true
    })

    result.sort((a, b) => {
      let valA: number = 0
      let valB: number = 0

      if (sortBy === 'rank') {
        valA = timeFilter !== 'all' && a.snapshot_rank ? a.snapshot_rank : a.all_time_rank
        valB = timeFilter !== 'all' && b.snapshot_rank ? b.snapshot_rank : b.all_time_rank
        return sortAsc ? valA - valB : valB - valA
      } else if (sortBy === 'stars') {
        valA = a.stars_count
        valB = b.stars_count
        if (valA !== valB) return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'readiness') {
        valA = a.ai_specs?.production_score || 0
        valB = b.ai_specs?.production_score || 0
        if (valA !== valB) return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'power_score') {
        valA = a.trending_power_score
        valB = b.trending_power_score
        if (valA !== valB) return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'growth_velocity') {
        valA = a.stars_today || 0
        valB = b.stars_today || 0
        if (valA !== valB) return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'peak') {
        valA = a.peak_rank
        valB = b.peak_rank
        if (valA !== valB) return sortAsc ? valA - valB : valB - valA
      } else if (sortBy === 'trending_days' || sortBy === 'days_7d') {
        valA = a.days_7d !== undefined ? a.days_7d : a.trending_days || 1
        valB = b.days_7d !== undefined ? b.days_7d : b.trending_days || 1
        if (valA !== valB) return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'current_streak') {
        valA = a.current_streak || 0
        valB = b.current_streak || 0
        if (valA !== valB) return sortAsc ? valB - valA : valA - valB
      }

      const rankA = timeFilter !== 'all' && a.snapshot_rank ? a.snapshot_rank : a.all_time_rank
      const rankB = timeFilter !== 'all' && b.snapshot_rank ? b.snapshot_rank : b.all_time_rank
      return rankA - rankB
    })

    return result
  }, [baseRepos, timeFilter, categoryFilter, languageFilter, searchQuery, sortBy, sortAsc, favoriteIds])

  return {
    selectedDate,
    setSelectedDate,
    categoryFilter,
    setCategoryFilter,
    languageFilter,
    setLanguageFilter,
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
  }
}
