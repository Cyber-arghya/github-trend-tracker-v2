import React, { useState, useMemo } from 'react'
import {
  Star,
  Search,
  Filter,
  ExternalLink,
  Flame,
  Terminal,
  Copy,
  Check,
  TrendingUp,
  Sparkles,
  Code2,
  RotateCcw,
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

  // Master list of all distinct categories & languages in dataset
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

  // 1. Coordinated Time Counts (matching current category & language)
  const timeCounts = useMemo(() => {
    const base = repos.filter((r) => {
      if (categoryFilter !== 'all' && (r.ai_specs?.architecture_type || 'Full-Stack App') !== categoryFilter) return false
      if (languageFilter !== 'all' && r.language !== languageFilter) return false
      return true
    })
    return {
      all: base.length,
      daily: base.filter((r) => r.daily_appearances > 0).length,
      weekly: base.filter((r) => r.weekly_appearances > 0).length,
      monthly: base.filter((r) => r.monthly_appearances > 0).length,
    }
  }, [repos, categoryFilter, languageFilter])

  // 2. Coordinated Category Counts (matching current time & language)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    allCategories.forEach((c) => {
      counts[c] = 0
    })

    const matching = repos.filter((r) => {
      if (timeFilter === 'daily' && r.daily_appearances === 0) return false
      if (timeFilter === 'weekly' && r.weekly_appearances === 0) return false
      if (timeFilter === 'monthly' && r.monthly_appearances === 0) return false
      if (languageFilter !== 'all' && r.language !== languageFilter) return false
      return true
    })

    counts.all = matching.length
    matching.forEach((r) => {
      const cat = r.ai_specs?.architecture_type || 'Full-Stack App'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [repos, timeFilter, languageFilter, allCategories])

  // 3. Coordinated Language Counts (matching current time & category)
  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    allLanguages.forEach((l) => {
      counts[l] = 0
    })

    const matching = repos.filter((r) => {
      if (timeFilter === 'daily' && r.daily_appearances === 0) return false
      if (timeFilter === 'weekly' && r.weekly_appearances === 0) return false
      if (timeFilter === 'monthly' && r.monthly_appearances === 0) return false
      if (categoryFilter !== 'all' && (r.ai_specs?.architecture_type || 'Full-Stack App') !== categoryFilter) return false
      return true
    })

    counts.all = matching.length
    matching.forEach((r) => {
      if (r.language) {
        counts[r.language] = (counts[r.language] || 0) + 1
      }
    })
    return counts
  }, [repos, timeFilter, categoryFilter, allLanguages])

  // Smart filter click handlers: toggle off if already active, or auto-coordinate
  const handleCategoryClick = (cat: string) => {
    if (categoryFilter === cat) {
      setCategoryFilter('all')
      return
    }
    // If selecting a category that has 0 matches for the current language, reset language to 'all'
    if (cat !== 'all' && languageFilter !== 'all') {
      const hasMatch = repos.some(
        (r) => (r.ai_specs?.architecture_type || 'Full-Stack App') === cat && r.language === languageFilter
      )
      if (!hasMatch) {
        setLanguageFilter('all')
      }
    }
    setCategoryFilter(cat)
  }

  const handleLanguageClick = (lang: string) => {
    if (languageFilter === lang) {
      setLanguageFilter('all')
      return
    }
    // If selecting a language that has 0 matches for the current category, reset category to 'all'
    if (lang !== 'all' && categoryFilter !== 'all') {
      const hasMatch = repos.some(
        (r) => r.language === lang && (r.ai_specs?.architecture_type || 'Full-Stack App') === categoryFilter
      )
      if (!hasMatch) {
        setCategoryFilter('all')
      }
    }
    setLanguageFilter(lang)
  }

  const handleResetFilters = () => {
    setTimeFilter('all')
    setCategoryFilter('all')
    setLanguageFilter('all')
    setSearchQuery('')
  }

  // 4. Filtering and Sorting
  const filteredRepos = useMemo(() => {
    // Sanitize search query: strip full github url if pasted
    let cleanQuery = searchQuery.trim().toLowerCase()
    cleanQuery = cleanQuery.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')

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

      // Search query (supports repo name, description, tech stack, and pasted GitHub URL)
      if (cleanQuery !== '') {
        const matchName = r.repo_name.toLowerCase().includes(cleanQuery)
        const matchDesc = (r.description || '').toLowerCase().includes(cleanQuery)
        const matchProp = (r.ai_specs?.key_value_proposition || '').toLowerCase().includes(cleanQuery)
        const matchTech = (r.ai_specs?.tech_stack || []).some((t) => t.toLowerCase().includes(cleanQuery))
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

  // Red-to-green gradient helper based on power score
  const getPowerScoreStyle = (score: number) => {
    if (score >= 70) {
      return {
        text: 'text-success-400',
        bar: 'bg-gradient-to-r from-emerald-500 to-green-400',
      }
    }
    if (score >= 45) {
      return {
        text: 'text-warning-400',
        bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      }
    }
    return {
      text: 'text-error-400',
      bar: 'bg-gradient-to-r from-red-600 to-rose-400',
    }
  }

  return (
    /* Unified Card Container with ZERO GAP between Filter and Table */
    <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-md">
      {/* ─── Filter Section (Directly Top Zone of Container, Zero Gap) ─── */}
      <div className="bg-neutral-900/95 border-b border-neutral-800 p-2.5 sm:p-3 space-y-2 rounded-t-xl">
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

          {/* Search Bar (Auto-resolves pasted GitHub URLs) */}
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

        {/* Row 2: Category Filter Pills (Coordinated) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 text-xs">
          <span className="text-neutral-400 text-[11px] font-semibold shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-primary-400" />
            Category:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {allCategories.map((cat) => {
              const count = categoryCounts[cat] || 0
              const isActive = categoryFilter === cat
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-neutral-200 text-neutral-900 font-bold shadow-sm'
                      : count === 0
                      ? 'bg-neutral-950/40 text-neutral-600 border border-neutral-800/40 hover:text-neutral-400'
                      : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  <span>{cat === 'all' ? 'All' : cat}</span>
                  <span className="text-[10px] opacity-70 font-mono">({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 3: Language Filter Pills directly below Category (Coordinated) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 text-xs border-t border-neutral-800/60">
          <span className="text-neutral-400 text-[11px] font-semibold shrink-0 flex items-center gap-1 mr-1">
            <Code2 className="w-3 h-3 text-primary-400" />
            Language:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {allLanguages.map((lang) => {
              const count = languageCounts[lang] || 0
              const isActive = languageFilter === lang
              return (
                <button
                  key={lang}
                  onClick={() => handleLanguageClick(lang)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50 font-bold'
                      : count === 0
                      ? 'bg-neutral-950/40 text-neutral-600 border border-neutral-800/40 hover:text-neutral-400'
                      : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  <span>{lang === 'all' ? 'All Languages' : lang}</span>
                  <span className="text-[10px] opacity-70 font-mono">({count})</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Table Section (Attached Directly, Zero Gap, Sticky Header) ─── */}
      <table className="w-full text-left text-xs text-neutral-300">
        <thead className="bg-neutral-950 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 shadow-sm">
          <tr>
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3.5 py-2.5 w-16 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('rank')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <span>Rank</span>
                <TrendingUp className="w-3 h-3 text-primary-400" />
              </div>
            </th>
            <th className="sticky top-0 z-30 bg-neutral-950 px-3.5 py-2.5 min-w-[280px] border-b border-neutral-800">
              Repository
            </th>
            {/* Short name for Velocity */}
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3.5 py-2.5 w-36 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('growth_velocity')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <span>Velocity</span>
                <Flame className="w-3 h-3 text-warning-400" />
              </div>
            </th>
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3.5 py-2.5 w-32 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('power_score')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <span>Power Score</span>
              </div>
            </th>
            <th className="sticky top-0 z-30 bg-neutral-950 px-3.5 py-2.5 w-16 border-b border-neutral-800">
              Peak
            </th>
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3.5 py-2.5 w-28 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('stars')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <span>Total Stars</span>
              </div>
            </th>
            <th className="sticky top-0 z-30 bg-neutral-950 px-3.5 py-2.5 w-40 border-b border-neutral-800">
              Architecture
            </th>
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
              const scoreStyle = getPowerScoreStyle(row.trending_power_score)

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
                  {/* Main Row: Click anywhere for AI specs, NO description in main row */}
                  <tr
                    className={`hover:bg-neutral-800/50 transition-colors cursor-pointer group ${
                      isExpanded ? 'bg-neutral-800/40' : ''
                    }`}
                    onClick={() => toggleExpand(row.repo_id)}
                    title="Click row to view AI intelligence specs"
                  >
                    {/* Rank */}
                    <td className="px-3.5 py-2.5 font-mono font-bold whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${rankBadge}`}>
                        {rankIcon ? `${rankIcon} #${rank}` : `#${rank}`}
                      </span>
                    </td>

                    {/* Repository: Name & language tag ONLY (Description removed per request) */}
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
                    </td>

                    {/* Velocity: Clean stars/day with compact alert tag for notification setup */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div
                        className="flex items-center gap-1.5 whitespace-nowrap"
                        data-notification-status={isBreakout ? 'breakout' : isSurging ? 'surge' : 'normal'}
                      >
                        <span
                          className={`font-mono text-xs font-bold ${
                            isBreakout
                              ? 'text-error-400'
                              : isSurging
                              ? 'text-warning-400'
                              : starsToday > 0
                              ? 'text-neutral-200'
                              : 'text-neutral-500'
                          }`}
                        >
                          {starsToday > 0 ? `+${starsToday.toLocaleString()}/day` : '—'}
                        </span>

                        {/* Future Notification System Trigger Tag */}
                        {isBreakout && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded bg-error-500/20 text-error-400 border border-error-500/30"
                            title="Breakout Repo (>1000 stars/day) - Notification Target"
                          >
                            🔥
                          </span>
                        )}
                        {isSurging && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded bg-warning-500/20 text-warning-400 border border-warning-500/30"
                            title="Surging Repo (>500 stars/day) - Notification Target"
                          >
                            ⚡
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Power Score: Red-to-green gradient depending on score */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${scoreStyle.text}`}>
                          {row.trending_power_score.toFixed(1)}
                        </span>
                        <div className="w-14 h-1.5 bg-neutral-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full ${scoreStyle.bar} rounded-full transition-all duration-300`}
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
                          {/* Card Header */}
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
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <p>No repositories found matching your filter criteria.</p>
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
