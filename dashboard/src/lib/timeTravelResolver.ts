import type { UnifiedRepoItem, TrendingSnapshotItem, TimePeriodFilter } from '../types'

/**
 * Extracts all unique snapshot dates (YYYY-MM-DD) available for a given time period.
 * Dates are sorted in reverse chronological order (newest first).
 */
export function extractAvailableSnapshotDates(
  snapshots: TrendingSnapshotItem[],
  period: TimePeriodFilter
): string[] {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return []
  }

  const matchingSnapshots =
    period === 'all'
      ? snapshots
      : snapshots.filter((snapshot) => snapshot.period === period)

  const uniqueDateStrings = new Set<string>()
  for (const snapshot of matchingSnapshots) {
    if (snapshot.recorded_at && typeof snapshot.recorded_at === 'string' && snapshot.recorded_at.length >= 10) {
      uniqueDateStrings.add(snapshot.recorded_at.slice(0, 10))
    }
  }

  return Array.from(uniqueDateStrings).sort().reverse()
}

/**
 * Determines the effective active date for historical view.
 * If user selected a date that is still valid, use it; otherwise fallback to newest available date.
 */
export function resolveEffectiveSnapshotDate(
  userSelectedDate: string | null | undefined,
  availableDates: string[]
): string {
  if (!Array.isArray(availableDates) || availableDates.length === 0) {
    return ''
  }

  if (userSelectedDate && availableDates.includes(userSelectedDate)) {
    return userSelectedDate
  }

  return availableDates[0]
}

/**
 * Resolves repository items to display for the active period and snapshot date.
 * - For 'all': returns the full all-time repository catalog.
 * - For 'daily', 'weekly', 'monthly': extracts snapshots for target date, deduplicates
 *   by repo_id keeping the best rank, merges with catalog metadata, and sorts by that day's rank.
 */
export function resolveHistoricalSnapshotItems(
  allRepositories: UnifiedRepoItem[],
  allSnapshots: TrendingSnapshotItem[],
  activePeriod: TimePeriodFilter,
  targetSnapshotDate: string
): UnifiedRepoItem[] {
  // Defensive guard: All-Time mode directly uses full catalog
  if (activePeriod === 'all') {
    return allRepositories
  }

  // Defensive guard: If no snapshots or no target date, fallback to legacy appearances filter
  if (
    !Array.isArray(allSnapshots) ||
    allSnapshots.length === 0 ||
    !targetSnapshotDate ||
    targetSnapshotDate.trim() === ''
  ) {
    return allRepositories.filter((repo) => {
      if (activePeriod === 'daily') return repo.daily_appearances > 0
      if (activePeriod === 'weekly') return repo.weekly_appearances > 0
      if (activePeriod === 'monthly') return repo.monthly_appearances > 0
      return true
    })
  }

  // 1. Filter snapshots matching active period and exact snapshot calendar date
  const matchingDateSnapshots = allSnapshots.filter(
    (snapshot) =>
      snapshot.period === activePeriod &&
      typeof snapshot.recorded_at === 'string' &&
      snapshot.recorded_at.startsWith(targetSnapshotDate)
  )

  if (matchingDateSnapshots.length === 0) {
    return []
  }

  // 2. Deduplicate snapshots by repo_id (keeping best / lowest rank if multiple cron runs occurred)
  const bestSnapshotByRepoId = new Map<string, TrendingSnapshotItem>()
  for (const snapshot of matchingDateSnapshots) {
    const existingEntry = bestSnapshotByRepoId.get(snapshot.repo_id)
    if (!existingEntry || snapshot.rank < existingEntry.rank) {
      bestSnapshotByRepoId.set(snapshot.repo_id, snapshot)
    }
  }

  // 3. Fast lookup map for repository catalog
  const repositoryCatalogLookup = new Map<string, UnifiedRepoItem>()
  for (const repo of allRepositories) {
    repositoryCatalogLookup.set(repo.repo_id, repo)
  }

  // 4. Build output list sorted by that day's rank
  const resolvedSnapshotItems: UnifiedRepoItem[] = []
  const sortedSnapshots = Array.from(bestSnapshotByRepoId.values()).sort(
    (a, b) => a.rank - b.rank
  )

  for (const snapshot of sortedSnapshots) {
    const repoMetadata = repositoryCatalogLookup.get(snapshot.repo_id)
    if (repoMetadata) {
      resolvedSnapshotItems.push({
        ...repoMetadata,
        snapshot_rank: snapshot.rank,
        snapshot_date: targetSnapshotDate,
        stars_today: snapshot.stars_today,
        latest_period: snapshot.period,
      })
    }
  }

  return resolvedSnapshotItems
}

/**
 * Calculates coordinated counts for each period pill:
 * - 'all': Total distinct tracked repositories
 * - 'daily' / 'weekly' / 'monthly': Count of distinct repositories on target date
 */
export function calculateCoordinatedTimePeriodCounts(
  allRepositories: UnifiedRepoItem[],
  allSnapshots: TrendingSnapshotItem[],
  activePeriod: TimePeriodFilter,
  effectiveSnapshotDate: string
): Record<TimePeriodFilter, number> {
  const totalTrackedCount = Array.isArray(allRepositories) ? allRepositories.length : 0

  if (!Array.isArray(allSnapshots) || allSnapshots.length === 0) {
    return {
      all: totalTrackedCount,
      daily: allRepositories.filter((r) => r.daily_appearances > 0).length,
      weekly: allRepositories.filter((r) => r.weekly_appearances > 0).length,
      monthly: allRepositories.filter((r) => r.monthly_appearances > 0).length,
    }
  }

  const getDistinctRepoCountForPeriod = (periodKey: 'daily' | 'weekly' | 'monthly'): number => {
    const periodSnapshots = allSnapshots.filter((s) => s.period === periodKey)
    if (periodSnapshots.length === 0) return 0

    // Use currently viewed date if viewing that period, else use that period's newest date
    const targetDate =
      periodKey === activePeriod && effectiveSnapshotDate
        ? effectiveSnapshotDate
        : periodSnapshots[0]?.recorded_at?.slice(0, 10) || ''

    if (!targetDate) return 0

    const matchingRepoIds = new Set<string>()
    for (const s of periodSnapshots) {
      if (s.recorded_at && s.recorded_at.startsWith(targetDate)) {
        matchingRepoIds.add(s.repo_id)
      }
    }
    return matchingRepoIds.size
  }

  return {
    all: totalTrackedCount,
    daily: getDistinctRepoCountForPeriod('daily'),
    weekly: getDistinctRepoCountForPeriod('weekly'),
    monthly: getDistinctRepoCountForPeriod('monthly'),
  }
}

