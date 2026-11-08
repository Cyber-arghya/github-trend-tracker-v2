import { useState, useEffect, useCallback, useMemo } from 'react'
import { Header } from './components/Header'
import { UnifiedTableView } from './components/UnifiedTableView'
import { supabase } from './lib/supabase'
import type { UnifiedRepoItem, TrendingSnapshotItem, TimeFilter } from './types'
import { calculateRepoSnapshotMetrics, calculateGoldenTrendPowerScore } from './lib/timeTravelResolver'

const FAVORITES_STORAGE_KEY = 'github_trend_favorites'

function loadFavoritesFromStorage(): Set<string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_STORAGE_KEY) : null
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return new Set(parsed)
      }
    }
  } catch (e) {
    console.error('Failed to load favorites from localStorage:', e)
  }
  return new Set()
}

function saveFavoritesToStorage(favs: Set<string>): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favs)))
    }
  } catch (e) {
    console.error('Failed to save favorites to localStorage:', e)
  }
}

export default function App() {
  const [repos, setRepos] = useState<UnifiedRepoItem[]>([])
  const [snapshots, setSnapshots] = useState<TrendingSnapshotItem[]>([])
  const [lastUpdatedIso, setLastUpdatedIso] = useState<string>('')
  const [activeTimeFilter, setActiveTimeFilter] = useState<TimeFilter>('all')
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => loadFavoritesFromStorage())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const handleToggleFavorite = useCallback((repoId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (next.has(repoId)) {
        next.delete(repoId)
      } else {
        next.add(repoId)
      }
      saveFavoritesToStorage(next)
      return next
    })
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Fetch leaderboard rows from Materialized View 'mv_all_time_leaderboard'
      const { data: mvData, error: mvError } = await supabase
        .from('mv_all_time_leaderboard')
        .select('*')
        .order('all_time_rank', { ascending: true })

      // 2. Fetch snapshot history from 'trending_snapshots'
      const { data: snapData } = await supabase
        .from('trending_snapshots')
        .select('id, repo_id, rank, period, stars_today, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1000)

      let snapshotMetricsMap = new Map<string, ReturnType<typeof calculateRepoSnapshotMetrics> extends Map<string, infer M> ? M : never>()

      if (snapData && snapData.length > 0) {
        const normalizedSnaps: TrendingSnapshotItem[] = (snapData as TrendingSnapshotItem[]).map((s) => {
          let vel = s.stars_today || 0
          if (s.period === 'monthly' && vel > 1000) {
            vel = Math.max(1, Math.round(vel / 30))
          } else if (s.period === 'weekly' && vel > 1000) {
            vel = Math.max(1, Math.round(vel / 7))
          }
          return { ...s, stars_today: vel }
        })
        setSnapshots(normalizedSnaps)

        // Capture newest snapshot timestamp for Last Updated indicator
        if (normalizedSnaps[0]?.recorded_at) {
          setLastUpdatedIso(normalizedSnaps[0].recorded_at)
        }

        // Calculate accurate rolling metrics, active streaks, 7d/30d presence directly from snapshots
        snapshotMetricsMap = calculateRepoSnapshotMetrics(normalizedSnaps)
      }

      if (!mvError && mvData && mvData.length > 0) {
        const unified: UnifiedRepoItem[] = mvData.map((row) => {
          const metrics = snapshotMetricsMap.get(row.repo_id)
          const starsToday = metrics ? metrics.latest_velocity : (row.stars_today || 0)
          const days7d = metrics?.days_7d ?? (row.days_7d ?? 0)
          const days30d = metrics?.days_30d ?? (row.days_30d ?? 1)
          const currentStreak = metrics?.current_streak ?? (row.current_streak ?? 0)
          const totalStars = row.stars_count || 0

          // True Golden Trend Power Score: Velocity + Hotness + Endurance + Streak + Stars Credibility
          const computedPower = calculateGoldenTrendPowerScore(
            starsToday,
            days7d,
            days30d,
            currentStreak,
            totalStars
          )

          return {
            ...row,
            stars_today: starsToday,
            latest_period: metrics ? metrics.latest_period : (row.latest_period || 'daily'),
            trending_days: metrics ? metrics.trending_days : (row.trending_days || 1),
            days_7d: days7d,
            days_30d: days30d,
            current_streak: currentStreak,
            max_streak_30d: metrics ? metrics.max_streak_30d : (row.max_streak_30d ?? 1),
            peak_rank: metrics ? metrics.peak_rank : (row.peak_rank ?? 99),
            trending_power_score: computedPower,
          }
        })

        // Re-order by true Golden Trend Power for All-Time ranking
        unified.sort((a, b) => b.trending_power_score - a.trending_power_score)
        unified.forEach((r, idx) => {
          r.all_time_rank = idx + 1
        })

        setRepos(unified)
      } else {
        // Fallback: Query 'repositories' directly
        const { data: fallbackRepos } = await supabase
          .from('repositories')
          .select('*')
          .order('trending_power_score', { ascending: false })

        if (fallbackRepos) {
          const unified: UnifiedRepoItem[] = fallbackRepos.map((r, idx) => {
            const metrics = snapshotMetricsMap.get(r.id)
            const starsToday = metrics ? metrics.latest_velocity : 0
            const days7d = metrics ? metrics.days_7d : 0
            const days30d = metrics ? metrics.days_30d : 1
            const currentStreak = metrics ? metrics.current_streak : 0
            const totalStars = r.stars_count || 0

            const computedPower = calculateGoldenTrendPowerScore(
              starsToday,
              days7d,
              days30d,
              currentStreak,
              totalStars
            )

            return {
              repo_id: r.id,
              repo_name: r.repo_name,
              owner: r.owner,
              name: r.name,
              description: r.description,
              language: r.language,
              stars_count: totalStars,
              forks_count: r.forks_count,
              ai_specs: r.ai_specs,
              first_seen_at: r.first_seen_at,
              last_seen_at: r.last_seen_at,
              total_appearances: 1,
              peak_rank: metrics ? metrics.peak_rank : 1,
              daily_appearances: 1,
              weekly_appearances: 0,
              monthly_appearances: 0,
              trending_days: metrics ? metrics.trending_days : 1,
              days_7d: days7d,
              days_30d: days30d,
              current_streak: currentStreak,
              max_streak_30d: metrics ? metrics.max_streak_30d : 1,
              trending_power_score: computedPower,
              all_time_rank: idx + 1,
              stars_today: starsToday,
              latest_period: metrics ? metrics.latest_period : 'daily',
            }
          })

          unified.sort((a, b) => b.trending_power_score - a.trending_power_score)
          unified.forEach((r, idx) => {
            r.all_time_rank = idx + 1
          })

          setRepos(unified)
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const breakoutCount = useMemo(() => {
    return repos.filter((r) => (r.stars_today || 0) >= 1000).length
  }, [repos])

  const multiDayCount = useMemo(() => {
    return repos.filter((r) => (r.days_7d || r.trending_days || 1) >= 3).length
  }, [repos])

  const activeStreaksCount = useMemo(() => {
    return repos.filter((r) => (r.current_streak || 0) >= 2).length
  }, [repos])

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <Header
        totalTracked={repos.length}
        breakoutCount={breakoutCount}
        multiDayCount={multiDayCount}
        activeStreaksCount={activeStreaksCount}
        favoritesCount={favoriteIds.size}
        onShowFavorites={() => setActiveTimeFilter('favorites')}
        isLoading={isLoading}
        onRefresh={fetchData}
      />

      <main className="flex-1 max-w-[1720px] w-full mx-auto px-2 sm:px-4 pt-1.5 pb-4">
        <UnifiedTableView
          repos={repos}
          snapshots={snapshots}
          lastUpdatedIso={lastUpdatedIso}
          timeFilter={activeTimeFilter}
          onTimeFilterChange={setActiveTimeFilter}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoading}
        />
      </main>

      <footer className="border-t border-neutral-900 bg-neutral-950 py-2.5 text-center text-xs text-neutral-500">
        GitHub Trend Tracker · Real-time Breakout Radar & AI Intelligence
      </footer>
    </div>
  )
}
