import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { LeaderboardTab } from './components/tabs/LeaderboardTab'
import { SnapshotsTab } from './components/tabs/SnapshotsTab'
import { CatalogTab } from './components/tabs/CatalogTab'
import { supabase } from './lib/supabase'
import type { ActiveTab, LeaderboardItem, TrendingSnapshot } from './types'

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('leaderboard')
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([])
  const [snapshots, setSnapshots] = useState<TrendingSnapshot[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Attempt to fetch from Materialized View 'mv_all_time_leaderboard'
      const { data: mvData, error: mvError } = await supabase
        .from('mv_all_time_leaderboard')
        .select('*')
        .order('all_time_rank', { ascending: true })

      if (!mvError && mvData && mvData.length > 0) {
        setLeaderboardData(mvData as LeaderboardItem[])
      } else {
        // Fallback: Query 'repositories' table directly
        const { data: reposData } = await supabase
          .from('repositories')
          .select('*')
          .order('trending_power_score', { ascending: false })

        if (reposData) {
          const mapped: LeaderboardItem[] = reposData.map((r, idx) => ({
            repo_id: r.id,
            repo_name: r.repo_name,
            owner: r.owner,
            name: r.name,
            description: r.description,
            language: r.language,
            stars_count: r.stars_count,
            forks_count: r.forks_count,
            ai_specs: r.ai_specs,
            total_appearances: 1,
            peak_rank: 1,
            daily_appearances: 1,
            weekly_appearances: 0,
            monthly_appearances: 0,
            trending_power_score: r.trending_power_score || 0,
            all_time_rank: idx + 1,
          }))
          setLeaderboardData(mapped)
        }
      }

      // 2. Fetch latest trending snapshots joined with repositories
      const { data: snapData } = await supabase
        .from('trending_snapshots')
        .select(`
          id, repo_id, rank, period, stars_today, recorded_at,
          repositories ( repo_name, owner, name, description, language, stars_count, forks_count, ai_specs )
        `)
        .order('recorded_at', { ascending: false })
        .limit(100)

      if (snapData) {
        setSnapshots(snapData as unknown as TrendingSnapshot[])
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalTracked={leaderboardData.length}
        isLoading={isLoading}
        onRefresh={fetchData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            data={leaderboardData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'snapshots' && (
          <SnapshotsTab
            snapshots={snapshots}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogTab
            repos={leaderboardData}
            isLoading={isLoading}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        GitHub Trend Tracker V2 · Relational PostgreSQL · NVIDIA Nemotron 550B AI · Zero-Storage Architecture
      </footer>
    </div>
  )
}
