import React, { useState, useMemo } from 'react'
import {
  Star,
  Search,
  Filter,
  ExternalLink,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp,
  Terminal,
  Copy,
  Check,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import type { UnifiedRepoItem, TimeFilter, SortOption } from '../types'

interface UnifiedTableViewProps {
  repos: UnifiedRepoItem[]
  isLoading: boolean
}

export const UnifiedTableView: React.FC<UnifiedTableViewProps> = ({ repos, isLoading }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('rank')
  const [sortAsc, setSortAsc] = useState<boolean>(true)
  const [expandedRepoId, setExpandedRepoId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 1. Dynamic Counts: Time-wise
  const timeCounts = useMemo(() => {
    return {
      all: repos.length,
      daily: repos.filter((r) => r.daily_appearances > 0).length,
      weekly: repos.filter((r) => r.weekly_appearances > 0).length,
      monthly: repos.filter((r) => r.monthly_appearances > 0).length,
    }
  }, [repos])

  // 2. Dynamic Counts: Category-wise
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: repos.length }
    repos.forEach((r) => {
      const cat = r.ai_specs?.architecture_type || 'Full-Stack App'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [repos])

  const categories = useMemo(() => Object.keys(categoryCounts), [categoryCounts])

  // 3. Dynamic Counts: Language-wise
  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: repos.length }
    repos.forEach((r) => {
      if (r.language) {
        counts[r.language] = (counts[r.language] || 0) + 1
      }
    })
    return counts
  }, [repos])

  const languages = useMemo(() => Object.keys(languageCounts), [languageCounts])

  // 4. Filtering and Sorting
  const filteredRepos = useMemo(() => {
    let result = repos.filter((r) => {
      // Time filter
      if (timeFilter === 'daily' && r.daily_appearances === 0) return false
      if (timeFilter === 'weekly' && r.weekly_appearances === 0) return false
      if (timeFilter === 'monthly' && r.monthly_appearances === 0) return false

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = r.ai_specs?.architecture_type || 'Full-Stack App'
        if (cat !== categoryFilter) return false
      }

      // Language filter
      if (languageFilter !== 'all' && r.language !== languageFilter) return false

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchName = r.repo_name.toLowerCase().includes(query)
        const matchDesc = (r.description || '').toLowerCase().includes(query)
        const matchProp = (r.ai_specs?.key_value_proposition || '').toLowerCase().includes(query)
        const matchTech = (r.ai_specs?.tech_stack || []).some((t) => t.toLowerCase().includes(query))
        if (!matchName && !matchDesc && !matchProp && !matchTech) return false
      }

      return true
    })

    // Sort
    result.sort((a, b) => {
      let valA: number = 0
      let valB: number = 0

      if (sortBy === 'rank') {
        valA = a.all_time_rank
        valB = b.all_time_rank
        return sortAsc ? valA - valB : valB - valA
      } else if (sortBy === 'power_score') {
        valA = a.trending_power_score
        valB = b.trending_power_score
        return sortAsc ? valB - valA : valA - valB // default desc for scores
      } else if (sortBy === 'growth_velocity') {
        valA = a.stars_today || 0
        valB = b.stars_today || 0
        return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'stars') {
        valA = a.stars_count
        valB = b.stars_count
        return sortAsc ? valB - valA : valA - valB
      }
      return 0
    })

    return result
  }, [repos, timeFilter, categoryFilter, languageFilter, searchQuery, sortBy, sortAsc])

  const toggleSort = (field: SortOption) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(field)
      setSortAsc(field === 'rank')
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleExpand = (id: string) => {
    setExpandedRepoId(expandedRepoId === id ? null : id)
  }

  return (
    <div className="space-y-4">
      {/* ─── Unified Control Bar (Time + Category + Search + Language) ─── */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
        {/* Row 1: Time Filters & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All-Time' },
                { id: 'daily', label: 'Today (Daily)' },
                { id: 'weekly', label: 'This Week' },
                { id: 'monthly', label: 'This Month' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setTimeFilter(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  timeFilter === item.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    timeFilter === item.id ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {timeCounts[item.id]}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar & Language Selector */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search repo, stack, or problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === 'all' ? `All Languages (${languageCounts.all})` : `${lang} (${languageCounts[lang]})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Category / Architecture Tag Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Category:
          </span>
          <div className="flex items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  categoryFilter === cat
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <span>{cat === 'all' ? 'All' : cat}</span>
                <span className="text-[10px] opacity-70 font-mono">({categoryCounts[cat]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Unified High-Density Data Table ─── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('rank')}>
                <div className="flex items-center gap-1 hover:text-white">
                  <span>Rank</span>
                  <TrendingUp className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3">Repository</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('growth_velocity')}>
                <div className="flex items-center gap-1 hover:text-white">
                  <span>VC Radar (Velocity)</span>
                  <Flame className="w-3 h-3 text-amber-400" />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('power_score')}>
                <div className="flex items-center gap-1 hover:text-white">
                  <span>Power Score</span>
                </div>
              </th>
              <th className="px-4 py-3">Peak</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('stars')}>
                <div className="flex items-center gap-1 hover:text-white">
                  <span>Total Stars</span>
                </div>
              </th>
              <th className="px-4 py-3">Architecture</th>
              <th className="px-4 py-3">Readiness</th>
              <th className="px-4 py-3 text-right">AI Insights</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading && repos.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
                    <span>Loading trending repositories...</span>
                  </div>
                </td>
              </tr>
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map((row) => {
                const rank = row.all_time_rank
                const isExpanded = expandedRepoId === row.repo_id
                const starsToday = row.stars_today || 0
                const isBreakout = starsToday >= 1000
                const isSurging = starsToday >= 500 && starsToday < 1000
                const prodScore = row.ai_specs?.production_score || 75

                let rankBadge = 'bg-slate-800 text-slate-300'
                let rankIcon = null
                if (rank === 1) {
                  rankBadge = 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  rankIcon = '🥇'
                } else if (rank === 2) {
                  rankBadge = 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                  rankIcon = '🥈'
                } else if (rank === 3) {
                  rankBadge = 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                  rankIcon = '🥉'
                }

                return (
                  <React.Fragment key={row.repo_id}>
                    {/* Main Row */}
                    <tr
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-slate-800/30' : ''
                      }`}
                      onClick={() => toggleExpand(row.repo_id)}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3.5 font-mono font-bold whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${rankBadge}`}>
                          {rankIcon ? `${rankIcon} #${rank}` : `#${rank}`}
                        </span>
                      </td>

                      {/* Repository Name & Description */}
                      <td className="px-4 py-3.5 max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://github.com/${row.repo_name}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-slate-100 hover:text-indigo-400 hover:underline flex items-center gap-1.5 text-sm"
                          >
                            <span>{row.repo_name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500 hover:text-indigo-400 shrink-0" />
                          </a>
                          {row.language && (
                            <span className="px-2 py-0.2 text-[10px] font-medium rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                              {row.language}
                            </span>
                          )}
                        </div>
                        {row.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{row.description}</p>
                        )}
                      </td>

                      {/* VC Radar / Growth Velocity */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isBreakout ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 font-semibold font-mono text-[11px]">
                            <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                            <span>+{starsToday.toLocaleString()}/day</span>
                            <span className="px-1 py-0.2 text-[9px] bg-red-500/20 rounded uppercase tracking-wider">
                              Breakout
                            </span>
                          </div>
                        ) : isSurging ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[11px]">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>+{starsToday.toLocaleString()}/day</span>
                          </div>
                        ) : starsToday > 0 ? (
                          <span className="font-mono text-slate-300 text-[11px]">
                            +{starsToday.toLocaleString()}/day
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">—</span>
                        )}
                      </td>

                      {/* Power Score */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {row.trending_power_score.toFixed(1)}
                          </span>
                          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full"
                              style={{ width: `${Math.min(row.trending_power_score, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Peak Rank */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[11px] font-mono font-medium text-emerald-400 border border-slate-700/50">
                          #{row.peak_rank}
                        </span>
                      </td>

                      {/* Total Stars */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-300">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                          <span>{row.stars_count.toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {row.ai_specs?.architecture_type || 'Full-Stack App'}
                        </span>
                      </td>

                      {/* Readiness */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            prodScore >= 85
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {prodScore}/100
                        </span>
                      </td>

                      {/* Expand Toggle */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(row.repo_id)
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1 text-[11px]"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>{isExpanded ? 'Hide' : 'AI'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>

                    {/* ─── Expandable AI Intelligence Card (In-Place) ─── */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-0 bg-slate-950/80 border-b border-indigo-500/30">
                          <div className="p-5 space-y-3.5 max-w-5xl mx-auto animate-in fade-in duration-200">
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <h4 className="font-bold text-white text-sm">
                                  {row.repo_name}
                                </h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  {row.ai_specs?.architecture_type || 'Full-Stack App'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs">Readiness:</span>
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                                  {prodScore}/100
                                </span>
                                <a
                                  href={`https://github.com/${row.repo_name}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ml-2 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                  <span>Open on GitHub</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            {/* Value Proposition */}
                            <div>
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                Value Proposition:
                              </span>
                              <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                                "{row.ai_specs?.key_value_proposition || row.description || 'No summary available.'}"
                              </p>
                            </div>

                            {/* Tech Stack Pills & License */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="text-slate-400 text-[11px] font-medium mr-2">Tech Stack:</span>
                                <div className="inline-flex flex-wrap gap-1 mt-1 sm:mt-0">
                                  {(row.ai_specs?.tech_stack || [row.language || 'Open Source']).map((tech, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="text-slate-400">
                                License: <strong className="text-slate-200">{row.ai_specs?.license_risk || 'Low (MIT/Apache 2.0)'}</strong>
                              </div>
                            </div>

                            {/* Quick Start Command */}
                            {row.ai_specs?.quick_start_command && (
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
                                <div className="flex items-center gap-2 overflow-x-auto">
                                  <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
                                  <span className="truncate">{row.ai_specs.quick_start_command}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(row.ai_specs!.quick_start_command!, row.repo_id)}
                                  className="ml-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                                  title="Copy Command"
                                >
                                  {copiedId === row.repo_id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  No repositories found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
