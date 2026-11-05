import { useState, useEffect, useCallback, useMemo } from 'react'
import { Header } from './components/Header'
import { UnifiedTableView } from './components/UnifiedTableView'
import { supabase } from './lib/supabase'
import type { UnifiedRepoItem } from './types'

export default function App() {
  const [repos, setRepos] = useState<UnifiedRepoItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Fetch leaderboard rows from Materialized View 'mv_all_time_leaderboard'
      const { data: mvData, error: mvError } = await supabase
        .from('mv_all_time_leaderboard')
        .select('*')
        .order('all_time_rank', { ascending: true })

      // 2. Fetch latest snapshot velocities (stars_today) from 'trending_snapshots'
      const { data: snapData } = await supabase
        .from('trending_snapshots')
        .select('repo_id, stars_today, period, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(200)

      // Map latest stars_today by repo_id
      const latestVelocityMap = new Map<string, { stars_today: number; period: 'daily' | 'weekly' | 'monthly' }>()
      if (snapData) {
        snapData.forEach((s) => {
          if (!latestVelocityMap.has(s.repo_id)) {
            latestVelocityMap.set(s.repo_id, {
              stars_today: s.stars_today || 0,
              period: s.period as 'daily' | 'weekly' | 'monthly',
            })
          }
        })
      }

      if (!mvError && mvData && mvData.length > 0) {
        const unified: UnifiedRepoItem[] = mvData.map((row) => {
          const velocity = latestVelocityMap.get(row.repo_id)
          return {
            ...row,
            stars_today: velocity?.stars_today || 0,
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        totalTracked={repos.length}
        breakoutCount={breakoutCount}
        isLoading={isLoading}
        onRefresh={fetchData}
      />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <UnifiedTableView repos={repos} isLoading={isLoading} />
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        GitHub Trend Tracker · VC Radar & AI Intelligence · Real-time Breakout Detection
      </footer>
    </div>
  )
}
