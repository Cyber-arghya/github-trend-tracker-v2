import type { UnifiedRepoItem, TrendingSnapshotItem, TimePeriodFilter } from '../types'

export interface RepoSnapshotMetrics {
  trending_days: number
  days_7d: number
  days_30d: number
  current_streak: number
  max_streak_30d: number
  peak_rank: number
  latest_velocity: number
  latest_period: 'daily' | 'weekly' | 'monthly'
}

/**
 * Formats a snapshot timestamp into a human-readable "Last updated" display string
 * and full UTC/local string for tooltips.
 */
export function formatLastUpdated(isoString?: string | null): { display: string; full: string } {
  if (!isoString || typeof isoString !== 'string') {
    return { display: '—', full: 'No update timestamp recorded' }
  }

  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    return { display: '—', full: 'Invalid timestamp format' }
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (60 * 1000))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  let relative = ''
  if (diffMins < 1) relative = 'Just now'
  else if (diffMins < 60) relative = `${diffMins}m ago`
  else if (diffHours < 24) relative = `${diffHours}h ago`
  else relative = `${diffDays}d ago`

  const formattedUtc = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  }) + ' UTC'

  return {
    display: `${formattedUtc} (${relative})`,
    full: `Last scraped: ${date.toISOString()}\nLocal: ${date.toLocaleString()}`,
  }
}

/**
 * Calculates rolling metrics, consecutive day streaks (Gaps & Islands),
 * 7d hotness, 30d endurance, and peak rank directly from raw snapshots.
 * Provides resilient, self-healing metrics independent of materialized view staleness.
 */
export function calculateRepoSnapshotMetrics(
  snapshots: TrendingSnapshotItem[],
  referenceDateInput?: Date | string
): Map<string, RepoSnapshotMetrics> {
  const metricsMap = new Map<string, RepoSnapshotMetrics>()
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return metricsMap
  }

  // 1. Group snapshots by repo_id and track newest timestamp
  const snapshotsByRepo = new Map<string, TrendingSnapshotItem[]>()
  let newestTimestamp = ''

  for (const s of snapshots) {
    if (!s || !s.repo_id) continue
    if (!snapshotsByRepo.has(s.repo_id)) {
      snapshotsByRepo.set(s.repo_id, [])
    }
    snapshotsByRepo.get(s.repo_id)!.push(s)

    if (s.recorded_at && (!newestTimestamp || s.recorded_at > newestTimestamp)) {
      newestTimestamp = s.recorded_at
    }
  }

  // Determine reference date (passed in, or newest snapshot date, or today)
  let refDate: Date
  if (referenceDateInput) {
    refDate = typeof referenceDateInput === 'string' ? new Date(referenceDateInput) : referenceDateInput
  } else if (newestTimestamp && newestTimestamp.length >= 10) {
    refDate = new Date(newestTimestamp.slice(0, 10) + 'T00:00:00Z')
  } else {
    const todayStr = new Date().toISOString().slice(0, 10)
    refDate = new Date(todayStr + 'T00:00:00Z')
  }

  const ONE_DAY_MS = 86400000

  for (const [repoId, repoSnaps] of snapshotsByRepo.entries()) {
    // Collect distinct calendar dates (YYYY-MM-DD) sorted chronologically
    const distinctDates = Array.from(
      new Set(
        repoSnaps
          .filter((s) => typeof s.recorded_at === 'string' && s.recorded_at.length >= 10)
          .map((s) => s.recorded_at.slice(0, 10))
      )
    ).sort()

    const trending_days = distinctDates.length

    // Calculate rolling 7d and 30d window presence counts
    let days_7d = 0
    let days_30d = 0
    for (const dateStr of distinctDates) {
      const snapDate = new Date(dateStr + 'T00:00:00Z')
      const diffDays = Math.floor((refDate.getTime() - snapDate.getTime()) / ONE_DAY_MS)
      if (diffDays >= 0 && diffDays < 7) {
        days_7d++
      }
      if (diffDays >= 0 && diffDays < 30) {
        days_30d++
      }
    }

    // Best (lowest) rank observed across snapshots
    let peak_rank = 99
    for (const s of repoSnaps) {
      if (typeof s.rank === 'number' && s.rank > 0 && s.rank < peak_rank) {
        peak_rank = s.rank
      }
    }

    // Gaps and Islands: consecutive day streak calculation
    let current_streak = 0
    let max_streak_30d = 0
    let streakCounter = 0
    let prevDateTime: number | null = null

    for (const dateStr of distinctDates) {
      const curDateTime = new Date(dateStr + 'T00:00:00Z').getTime()
      if (prevDateTime !== null) {
        const diffDays = Math.round((curDateTime - prevDateTime) / ONE_DAY_MS)
        if (diffDays === 1) {
          streakCounter++
        } else {
          streakCounter = 1
        }
      } else {
        streakCounter = 1
      }

      if (streakCounter > max_streak_30d) {
        max_streak_30d = streakCounter
      }
      prevDateTime = curDateTime
    }

    // Active streak: last snapshot must be on reference date or 1 day prior
    if (distinctDates.length > 0) {
      const lastDateStr = distinctDates[distinctDates.length - 1]
      const lastDateTime = new Date(lastDateStr + 'T00:00:00Z').getTime()
      const diffFromRef = Math.floor((refDate.getTime() - lastDateTime) / ONE_DAY_MS)
      current_streak = diffFromRef <= 1 ? streakCounter : 0
    }

    // Latest velocity (prioritize daily snapshot over weekly/monthly)
    let latest_velocity = 0
    let latest_period: 'daily' | 'weekly' | 'monthly' = 'daily'

    const sortedSnaps = [...repoSnaps].sort((a, b) => {
      const tA = a.recorded_at || ''
      const tB = b.recorded_at || ''
      return tB.localeCompare(tA)
    })

    const dailySnap = sortedSnaps.find((s) => s.period === 'daily')
    if (dailySnap) {
      latest_velocity = dailySnap.stars_today || 0
      latest_period = 'daily'
    } else if (sortedSnaps[0]) {
      latest_velocity = sortedSnaps[0].stars_today || 0
      latest_period = sortedSnaps[0].period
    }

    metricsMap.set(repoId, {
      trending_days,
      days_7d,
      days_30d,
      current_streak,
      max_streak_30d,
      peak_rank,
      latest_velocity,
      latest_period,
    })
  }

  return metricsMap
}

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
 * - For 'all' or 'favorites': returns the full all-time repository catalog.
 * - For 'daily', 'weekly', 'monthly': extracts snapshots for target date, deduplicates
 *   by repo_id keeping best rank, breaks ties cleanly, and assigns unique sequential ranks (1..N).
 */
export function resolveHistoricalSnapshotItems(
  allRepositories: UnifiedRepoItem[],
  allSnapshots: TrendingSnapshotItem[],
  activePeriod: TimePeriodFilter,
  targetSnapshotDate: string
): UnifiedRepoItem[] {
  // Defensive guard: All-Time and Favorites modes directly use full catalog (filtered by caller if needed)
  if (activePeriod === 'all' || activePeriod === 'favorites') {
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

  // 2. Deduplicate snapshots by repo_id (keeping best rank if multiple cron runs occurred in one day)
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

  // 4. Sort snapshots deterministically with tie-breakers:
  //    - Primary: rank ASC (1, 2, 3...)
  //    - Secondary: stars_today DESC (higher velocity breaks rank ties)
  //    - Tertiary: trending_power_score DESC
  //    - Quaternary: stars_count DESC
  const sortedSnapshots = Array.from(bestSnapshotByRepoId.values()).sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank
    }
    const velDiff = (b.stars_today || 0) - (a.stars_today || 0)
    if (velDiff !== 0) return velDiff

    const repoA = repositoryCatalogLookup.get(a.repo_id)
    const repoB = repositoryCatalogLookup.get(b.repo_id)
    const scoreDiff = (repoB?.trending_power_score || 0) - (repoA?.trending_power_score || 0)
    if (scoreDiff !== 0) return scoreDiff

    return (repoB?.stars_count || 0) - (repoA?.stars_count || 0)
  })

  // 5. Build output list with GUARANTEED unique sequential ranks (idx + 1)
  const resolvedSnapshotItems: UnifiedRepoItem[] = []
  for (let idx = 0; idx < sortedSnapshots.length; idx++) {
    const snapshot = sortedSnapshots[idx]
    const repoMetadata = repositoryCatalogLookup.get(snapshot.repo_id)
    if (repoMetadata) {
      resolvedSnapshotItems.push({
        ...repoMetadata,
        snapshot_rank: idx + 1, // Guaranteed unique rank: #1, #2, #3, ..., #N
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
 * - 'favorites': Total favorited repositories count
 */
export function calculateCoordinatedTimePeriodCounts(
  allRepositories: UnifiedRepoItem[],
  allSnapshots: TrendingSnapshotItem[],
  activePeriod: TimePeriodFilter,
  effectiveSnapshotDate: string,
  favoritesCount: number = 0
): Record<TimePeriodFilter, number> {
  const totalTrackedCount = Array.isArray(allRepositories) ? allRepositories.length : 0

  if (!Array.isArray(allSnapshots) || allSnapshots.length === 0) {
    return {
      all: totalTrackedCount,
      daily: allRepositories.filter((r) => r.daily_appearances > 0).length,
      weekly: allRepositories.filter((r) => r.weekly_appearances > 0).length,
      monthly: allRepositories.filter((r) => r.monthly_appearances > 0).length,
      favorites: favoritesCount,
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
    favorites: favoritesCount,
  }
}
