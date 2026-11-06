import { useState, useEffect, useCallback, useMemo } from 'react'
import { Header } from './components/Header'
import { UnifiedTableView } from './components/UnifiedTableView'
import { supabase } from './lib/supabase'
import type { UnifiedRepoItem, TrendingSnapshotItem } from './types'

export default function App() {
  const [repos, setRepos] = useState<UnifiedRepoItem[]>([])
  const [snapshots, setSnapshots] = useState<TrendingSnapshotItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

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

      // Map latest stars_today by repo_id (Priority: Daily snapshots > Weekly > Monthly)
      const latestVelocityMap = new Map<string, { stars_today: number; period: 'daily' | 'weekly' | 'monthly' }>()
      if (snapData) {
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

        // Pass 1: Prioritize daily snapshots (ground truth for true 24h velocity)
        normalizedSnaps.forEach((s) => {
          if (s.period === 'daily' && !latestVelocityMap.has(s.repo_id)) {
            latestVelocityMap.set(s.repo_id, {
              stars_today: s.stars_today || 0,
              period: 'daily',
            })
          }
        })
        // Pass 2: Fallback to weekly/monthly snapshots if daily is not available
        normalizedSnaps.forEach((s) => {
          if (!latestVelocityMap.has(s.repo_id)) {
            latestVelocityMap.set(s.repo_id, {
              stars_today: s.stars_today || 0,
              period: s.period,
            })
          }
        })
      }

      if (!mvError && mvData && mvData.length > 0) {
        const unified: UnifiedRepoItem[] = mvData.map((row) => {
          const velocity = latestVelocityMap.get(row.repo_id)
          return {
            ...row,
            stars_today: velocity?.stars_today !== undefined ? velocity.stars_today : (row.stars_today || 0),
            latest_period: velocity?.period || 'daily',
          }
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
            const velocity = latestVelocityMap.get(r.id)
            return {
              repo_id: r.id,
              repo_name: r.repo_name,
              owner: r.owner,
              name: r.name,
              description: r.description,
              language: r.language,
              stars_count: r.stars_count,
              forks_count: r.forks_count,
              ai_specs: r.ai_specs,
              first_seen_at: r.first_seen_at,
              last_seen_at: r.last_seen_at,
              total_appearances: 1,
              peak_rank: 1,
              daily_appearances: 1,
              weekly_appearances: 0,
              monthly_appearances: 0,
              trending_days: 1,
              trending_power_score: r.trending_power_score || 0,
              all_time_rank: idx + 1,
              stars_today: velocity?.stars_today || 0,
              latest_period: velocity?.period || 'daily',
            }
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
        isLoading={isLoading}
        onRefresh={fetchData}
      />

      <main className="flex-1 max-w-[1720px] w-full mx-auto px-2 sm:px-4 pt-1.5 pb-4">
        <UnifiedTableView repos={repos} snapshots={snapshots} isLoading={isLoading} />
      </main>

      <footer className="border-t border-neutral-900 bg-neutral-950 py-2.5 text-center text-xs text-neutral-500">
        GitHub Trend Tracker · Real-time Breakout Radar & AI Intelligence
      </footer>
    </div>
  )
}
