import React, { useState, useMemo } from 'react'
import { Star, Search, Filter, ExternalLink, ArrowUpDown } from 'lucide-react'
import type { LeaderboardItem } from '../../types'

type SortField = 'all_time_rank' | 'trending_power_score' | 'stars_count' | 'repo_name'

interface LeaderboardTabProps {
  data: LeaderboardItem[]
  isLoading: boolean
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  data,
  isLoading,
}) => {
  const [sortField, setSortField] = useState<SortField>('all_time_rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')

  // Extract unique languages
  const languages = useMemo(() => {
    const set = new Set<string>()
    data.forEach((item) => {
      if (item.language) set.add(item.language)
    })
    return ['all', ...Array.from(set).sort()]
  }, [data])

  // Handle column header sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder(field === 'all_time_rank' ? 'asc' : 'desc')
    }
  }

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchLang = selectedLanguage === 'all' || item.language === selectedLanguage
      const matchSearch =
        globalFilter === '' ||
        item.repo_name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(globalFilter.toLowerCase()))
      return matchLang && matchSearch
    })

    return filtered.sort((a, b) => {
      let valA: string | number = a[sortField] ?? 0
      let valB: string | number = b[sortField] ?? 0

      if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = (valB as string).toLowerCase()
        return sortOrder === 'asc' ? valA.localeCompare(valB) : (valB as string).localeCompare(valA)
      }

      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    })
  }, [data, selectedLanguage, globalFilter, sortField, sortOrder])

  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search all-time ranked repos..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'all' ? 'All Languages' : lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('all_time_rank')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Rank</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('repo_name')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Repository</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('trending_power_score')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Power Score</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="px-4 py-3">Peak Rank</th>
              <th className="px-4 py-3">Appearances</th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('stars_count')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Total Stars</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="px-4 py-3">AI Intelligence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAndSortedData.length > 0 ? (
              filteredAndSortedData.map((row) => {
                const rank = row.all_time_rank
                let badge = 'bg-slate-800 text-slate-300'
                let icon = null
                if (rank === 1) {
                  badge = 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  icon = '🥇'
                } else if (rank === 2) {
                  badge = 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                  icon = '🥈'
                } else if (rank === 3) {
                  badge = 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                  icon = '🥉'
                }

                return (
                  <tr key={row.repo_id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Rank */}
                    <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${badge}`}>
                        {icon ? `${icon} #${rank}` : `#${rank}`}
                      </span>
                    </td>

                    {/* Repository */}
                    <td className="px-4 py-3 max-w-md">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://github.com/${row.repo_name}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1.5"
                        >
                          {row.repo_name}
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </a>
                        {row.language && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {row.language}
                          </span>
                        )}
                      </div>
                      {row.description && (
                        <p className="text-xs text-slate-400 truncate mt-1">{row.description}</p>
                      )}
                    </td>

                    {/* Power Score */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-400">
                          {row.trending_power_score.toFixed(1)}
                        </span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full"
                            style={{ width: `${Math.min(row.trending_power_score, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Peak Rank */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-mono font-medium text-emerald-400">
                        #{row.peak_rank}
                      </span>
                    </td>

                    {/* Appearances */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" title="Daily Appearances">
                          D:{row.daily_appearances}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20" title="Weekly Appearances">
                          W:{row.weekly_appearances}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20" title="Monthly Appearances">
                          M:{row.monthly_appearances}
                        </span>
                      </div>
                    </td>

                    {/* Stars */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs font-mono text-slate-300">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                        <span>{row.stars_count.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* AI Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.ai_specs?.architecture_type && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                            {row.ai_specs.architecture_type}
                          </span>
                        )}
                        {row.ai_specs?.production_score && (
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {row.ai_specs.production_score}/100
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No repositories found matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
