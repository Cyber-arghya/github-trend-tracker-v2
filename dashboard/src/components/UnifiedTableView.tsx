import React, { useState, useMemo } from 'react'
import {
  Star,
  Search,
  Filter,
  ExternalLink,
  Flame,
  Zap,
  Terminal,
  Copy,
  Check,
  TrendingUp,
  Sparkles,
  Code2,
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
        return sortAsc ? valB - valA : valA - valB
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
    <div className="space-y-2 w-full">
      {/* ─── Compact Filter Section (Non-sticky, naturally scrolls away) ─── */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl p-2.5 sm:p-3 space-y-2 shadow-sm">
        {/* Row 1: Time Filters + Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800 shrink-0 overflow-x-auto">
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
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  timeFilter === item.id
                    ? 'bg-primary-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    timeFilter === item.id ? 'bg-primary-600 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {timeCounts[item.id]}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search repo, tech stack, or problem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 text-xs">
          <span className="text-neutral-400 text-[11px] font-semibold shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-primary-400" />
            Category:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  categoryFilter === cat
                    ? 'bg-neutral-200 text-neutral-900 font-bold shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>{cat === 'all' ? 'All' : cat}</span>
                <span className="text-[10px] opacity-70 font-mono">({categoryCounts[cat]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Language Filter Pills directly below Category */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 text-xs border-t border-neutral-800/60">
          <span className="text-neutral-400 text-[11px] font-semibold shrink-0 flex items-center gap-1 mr-1">
            <Code2 className="w-3 h-3 text-primary-400" />
            Language:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguageFilter(lang)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  languageFilter === lang
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50 font-bold'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>{lang === 'all' ? 'All Languages' : lang}</span>
                <span className="text-[10px] opacity-70 font-mono">({languageCounts[lang]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Full-Width Table Container ─── */}
      <div className="w-full overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-md">
        <table className="w-full text-left text-xs text-neutral-300">
          {/* ONLY the Table Header Row is STICKY on scroll */}
          <thead className="sticky top-0 z-30 bg-neutral-950 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 shadow-sm">
            <tr>
              <th className="px-3.5 py-2.5 w-16 cursor-pointer select-none" onClick={() => toggleSort('rank')}>
                <div className="flex items-center gap-1 hover:text-neutral-100">
                  <span>Rank</span>
                  <TrendingUp className="w-3 h-3 text-primary-400" />
                </div>
              </th>
              <th className="px-3.5 py-2.5 min-w-[280px]">Repository</th>
              <th className="px-3.5 py-2.5 w-44 cursor-pointer select-none" onClick={() => toggleSort('growth_velocity')}>
                <div className="flex items-center gap-1 hover:text-neutral-100">
                  <span>VC Radar (Velocity)</span>
                  <Flame className="w-3 h-3 text-warning-400" />
                </div>
              </th>
              <th className="px-3.5 py-2.5 w-32 cursor-pointer select-none" onClick={() => toggleSort('power_score')}>
                <div className="flex items-center gap-1 hover:text-neutral-100">
                  <span>Power Score</span>
                </div>
              </th>
              <th className="px-3.5 py-2.5 w-16">Peak</th>
              <th className="px-3.5 py-2.5 w-28 cursor-pointer select-none" onClick={() => toggleSort('stars')}>
                <div className="flex items-center gap-1 hover:text-neutral-100">
                  <span>Total Stars</span>
                </div>
              </th>
              <th className="px-3.5 py-2.5 w-40">Architecture</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {isLoading && repos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-neutral-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
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

                let rankBadge = 'bg-neutral-800 text-neutral-300'
                let rankIcon = null
                if (rank === 1) {
                  rankBadge = 'bg-warning-500/20 text-warning-400 border border-warning-500/40'
                  rankIcon = '🥇'
                } else if (rank === 2) {
                  rankBadge = 'bg-neutral-300/20 text-neutral-200 border border-neutral-300/40'
                  rankIcon = '🥈'
                } else if (rank === 3) {
                  rankBadge = 'bg-warning-700/20 text-warning-500 border border-warning-700/40'
                  rankIcon = '🥉'
                }

                return (
                  <React.Fragment key={row.repo_id}>
                    {/* Main Row: Click anywhere to expand/collapse AI intelligence card */}
                    <tr
                      className={`hover:bg-neutral-800/50 transition-colors cursor-pointer group ${
                        isExpanded ? 'bg-neutral-800/40' : ''
                      }`}
                      onClick={() => toggleExpand(row.repo_id)}
                      title="Click to view AI Intelligence Specs"
                    >
                      {/* Rank */}
                      <td className="px-3.5 py-2.5 font-mono font-bold whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${rankBadge}`}>
                          {rankIcon ? `${rankIcon} #${rank}` : `#${rank}`}
                        </span>
                      </td>

                      {/* Repository Name & Description */}
                      <td className="px-3.5 py-2.5 max-w-sm sm:max-w-md">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://github.com/${row.repo_name}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-neutral-100 hover:text-primary-400 hover:underline flex items-center gap-1.5 text-xs sm:text-sm"
                            title="Open repository on GitHub"
                          >
                            <span>{row.repo_name}</span>
                            <ExternalLink className="w-3 h-3 text-neutral-500 hover:text-primary-400 shrink-0" />
                          </a>
                          {row.language && (
                            <span className="px-1.5 py-0.2 text-[10px] font-medium rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300">
                              {row.language}
                            </span>
                          )}
                        </div>
                        {row.description && (
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">{row.description}</p>
                        )}
                      </td>

                      {/* VC Radar / Velocity */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        {isBreakout ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-error-500/10 text-error-400 border border-error-500/30 font-semibold font-mono text-[11px]">
                            <Flame className="w-3 h-3 text-error-400 animate-pulse" />
                            <span>+{starsToday.toLocaleString()}/day</span>
                            <span className="px-1 py-0.2 text-[9px] bg-error-500/20 rounded uppercase tracking-wider font-sans font-bold">
                              Breakout
                            </span>
                          </div>
                        ) : isSurging ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-warning-500/10 text-warning-400 border border-warning-500/20 font-mono text-[11px]">
                            <Zap className="w-3 h-3 text-warning-400" />
                            <span>+{starsToday.toLocaleString()}/day</span>
                          </div>
                        ) : starsToday > 0 ? (
                          <span className="font-mono text-neutral-300 text-[11px]">
                            +{starsToday.toLocaleString()}/day
                          </span>
                        ) : (
                          <span className="text-neutral-500 text-[11px] font-mono">—</span>
                        )}
                      </td>

                      {/* Power Score */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-warning-400">
                            {row.trending_power_score.toFixed(1)}
                          </span>
                          <div className="w-12 h-1.5 bg-neutral-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-warning-400 rounded-full"
                              style={{ width: `${Math.min(row.trending_power_score, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Peak Rank */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span className="px-1.5 py-0.2 rounded bg-neutral-800/80 text-[10px] font-mono font-medium text-success-400 border border-neutral-700/50">
                          #{row.peak_rank}
                        </span>
                      </td>

                      {/* Total Stars */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-mono text-neutral-300">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning-400 fill-warning-400/20" />
                          <span>{row.stars_count.toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Architecture */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-primary-500/10 text-primary-300 border border-primary-500/20">
                          {row.ai_specs?.architecture_type || 'Full-Stack App'}
                        </span>
                      </td>
                    </tr>

                    {/* ─── Expandable AI Intelligence Card (Full Width, In-Place) ─── */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0 bg-neutral-950 border-y border-primary-500/30">
                          <div className="w-full px-4 sm:px-6 py-4 space-y-3.5 animate-in fade-in duration-150">
                            {/* Card Header: Repo title, Category, Readiness, and GitHub button */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-neutral-800">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary-400" />
                                <h4 className="font-bold text-neutral-50 text-sm">
                                  {row.repo_name}
                                </h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20">
                                  {row.ai_specs?.architecture_type || 'Full-Stack App'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-neutral-400 text-xs font-medium">Readiness:</span>
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-neutral-800 text-success-400 border border-neutral-700">
                                  {prodScore}/100
                                </span>
                                <a
                                  href={`https://github.com/${row.repo_name}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ml-2 px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                  <span>Open on GitHub</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            {/* Value Proposition */}
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                                Value Proposition:
                              </span>
                              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                                "{row.ai_specs?.key_value_proposition || row.description || 'No summary available.'}"
                              </p>
                            </div>

                            {/* Tech Stack Pills & License */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="text-neutral-400 text-[11px] font-medium mr-2">Tech Stack:</span>
                                <div className="inline-flex flex-wrap gap-1 mt-1 sm:mt-0">
                                  {(row.ai_specs?.tech_stack || [row.language || 'Open Source']).map((tech, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px]"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="text-neutral-400 text-[11px]">
                                License: <strong className="text-neutral-200">{row.ai_specs?.license_risk || 'Low (Standard OSS)'}</strong>
                              </div>
                            </div>

                            {/* Quick Start Command */}
                            {row.ai_specs?.quick_start_command && (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-300">
                                <div className="flex items-center gap-2 overflow-x-auto">
                                  <Terminal className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                                  <span className="truncate">{row.ai_specs.quick_start_command}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopy(row.ai_specs!.quick_start_command!, row.repo_id)
                                  }}
                                  className="ml-2 p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors shrink-0"
                                  title="Copy Command"
                                >
                                  {copiedId === row.repo_id ? (
                                    <Check className="w-3.5 h-3.5 text-success-400" />
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
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
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
