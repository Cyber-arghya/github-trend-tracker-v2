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
  Calendar,
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

  const maxObservedScore = useMemo(() => {
    if (repos.length === 0) return 100
    return Math.max(...repos.map((r) => r.trending_power_score || 0), 100)
  }, [repos])

  // 1. Coordinated Time Counts
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

  // 2. Coordinated Category Counts
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

  // 3. Coordinated Language Counts
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
    let cleanQuery = searchQuery.trim().toLowerCase()
    cleanQuery = cleanQuery.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')

    let result = repos.filter((r) => {
      if (timeFilter === 'daily' && r.daily_appearances === 0) return false
      if (timeFilter === 'weekly' && r.weekly_appearances === 0) return false
      if (timeFilter === 'monthly' && r.monthly_appearances === 0) return false

      if (categoryFilter !== 'all') {
        const cat = r.ai_specs?.architecture_type || 'Full-Stack App'
        if (cat !== categoryFilter) return false
      }

      if (languageFilter !== 'all' && r.language !== languageFilter) return false

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
      } else if (sortBy === 'stars') {
        valA = a.stars_count
        valB = b.stars_count
        return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'readiness') {
        valA = a.ai_specs?.production_score || 0
        valB = b.ai_specs?.production_score || 0
        return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'power_score') {
        valA = a.trending_power_score
        valB = b.trending_power_score
        return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'growth_velocity') {
        valA = a.stars_today || 0
        valB = b.stars_today || 0
        return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'peak') {
        valA = a.peak_rank
        valB = b.peak_rank
        return sortAsc ? valA - valB : valB - valA
      } else if (sortBy === 'trending_days' || sortBy === 'days_7d') {
        valA = a.days_7d !== undefined ? a.days_7d : (a.trending_days || 1)
        valB = b.days_7d !== undefined ? b.days_7d : (b.trending_days || 1)
        return sortAsc ? valB - valA : valA - valB
      } else if (sortBy === 'current_streak') {
        valA = a.current_streak || 0
        valB = b.current_streak || 0
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
      setSortAsc(field === 'rank' || field === 'peak')
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

  // Nuanced score-wise color and shade for Power Score (Scaled for 0-350 range)
  const getPowerScoreStyle = (score: number) => {
    if (score >= 180) {
      return {
        text: 'text-emerald-400 font-bold',
        bar: 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_8px_rgba(52,211,153,0.35)]',
      }
    }
    if (score >= 100) {
      return {
        text: 'text-teal-400 font-bold',
        bar: 'bg-gradient-to-r from-teal-400 to-emerald-500 shadow-[0_0_6px_rgba(20,184,166,0.25)]',
      }
    }
    if (score >= 50) {
      return {
        text: 'text-amber-400 font-semibold',
        bar: 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_6px_rgba(251,191,36,0.25)]',
      }
    }
    if (score >= 25) {
      return {
        text: 'text-orange-400 font-semibold',
        bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
      }
    }
    return {
      text: 'text-rose-400 font-bold',
      bar: 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.35)]',
    }
  }

  // Readiness badge color helper
  const getReadinessStyle = (score: number) => {
    if (score >= 85) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    }
    if (score >= 70) {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
    }
    return 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
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

      {/* ─── Table Section (Sticky Header in Exact Requested Column Order) ─── */}
      <table className="w-full text-left text-xs text-neutral-300">
        <thead className="bg-neutral-950 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 shadow-sm">
          <tr>
            {/* Rank */}
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-14 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('rank')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <span>Rank</span>
                <TrendingUp className="w-3 h-3 text-primary-400" />
              </div>
            </th>

            {/* Repository */}
            <th className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 min-w-[200px] border-b border-neutral-800">
              Repository
            </th>

            {/* 1st: Total Stars */}
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-24 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('stars')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <Star className="w-3 h-3 text-warning-400 fill-warning-400/20" />
                <span>Stars</span>
              </div>
            </th>

            {/* 2nd: Readiness */}
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-24 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('readiness')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <span>Readiness</span>
              </div>
            </th>

            {/* 3rd: Trend Power */}
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-32 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('power_score')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <span>Trend Power</span>
              </div>
            </th>

            {/* 4th: Velocity */}
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-32 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('growth_velocity')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <span>Velocity</span>
                <Flame className="w-3 h-3 text-warning-400" />
              </div>
            </th>

            {/* 5th: Peak */}
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-16 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('peak')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100">
                <span>Peak</span>
              </div>
            </th>

            {/* 6th: Streak & 7d Presence */}
            <th
              className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-24 cursor-pointer select-none border-b border-neutral-800"
              onClick={() => toggleSort('days_7d')}
            >
              <div className="flex items-center gap-1 hover:text-neutral-100" title="Recent 7-day presence & active streaks">
                <span>Streak / 7d</span>
                <Calendar className="w-3 h-3 text-primary-400" />
              </div>
            </th>

            {/* 7th: Language */}
            <th className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-24 border-b border-neutral-800">
              Language
            </th>

            {/* 8th: Category */}
            <th className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-36 border-b border-neutral-800">
              Category
            </th>

            {/* 9th: GitHub Link */}
            <th className="sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-24 text-right border-b border-neutral-800">
              GitHub
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60">
          {isLoading && repos.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-16 text-center text-neutral-500">
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
                  {/* Main Row: Click anywhere for AI specs */}
                  <tr
                    className={`hover:bg-neutral-800/50 transition-colors cursor-pointer group ${
                      isExpanded ? 'bg-neutral-800/40' : ''
                    }`}
                    onClick={() => toggleExpand(row.repo_id)}
                    title="Click row to view AI intelligence specs"
                  >
                    {/* 1. Rank */}
                    <td className="px-3 py-2.5 font-mono font-bold whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${rankBadge}`}>
                        {rankIcon ? `${rankIcon} #${rank}` : `#${rank}`}
                      </span>
                    </td>

                    {/* 2. Repository Name ONLY */}
                    <td className="px-3 py-2.5 max-w-xs sm:max-w-sm">
                      <span className="font-bold text-neutral-100 hover:text-primary-400 transition-colors text-xs sm:text-sm">
                        {row.repo_name}
                      </span>
                    </td>

                    {/* 3. Total Stars (1st in metric order) */}
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-neutral-200">
                      <div className="flex items-center gap-1 font-semibold">
                        <Star className="w-3 h-3 text-warning-400 fill-warning-400/20" />
                        <span>{row.stars_count.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* 4. Readiness (2nd in metric order) */}
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getReadinessStyle(prodScore)}`}>
                        {prodScore}/100
                      </span>
                    </td>

                    {/* 5. Trend Power (3rd in metric order: nuanced color & shade) */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs ${scoreStyle.text}`}>
                          {row.trending_power_score.toFixed(1)}
                        </span>
                        <div className="w-14 h-1.5 bg-neutral-800/90 rounded-full overflow-hidden hidden sm:block p-0">
                          <div
                            className={`h-full ${scoreStyle.bar} rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min(Math.round(((row.trending_power_score || 0) / maxObservedScore) * 100), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 6. Velocity (4th in metric order) */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
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

                        {isBreakout && (
                          <span
                            className="inline-flex items-center px-1 py-0.2 text-[10px] font-bold rounded bg-error-500/20 text-error-400 border border-error-500/30"
                            title="Breakout (>1000 stars/day) - Notification Target"
                          >
                            🔥
                          </span>
                        )}
                        {isSurging && (
                          <span
                            className="inline-flex items-center px-1 py-0.2 text-[10px] font-bold rounded bg-warning-500/20 text-warning-400 border border-warning-500/30"
                            title="Surge (>500 stars/day) - Notification Target"
                          >
                            ⚡
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 7. Peak (5th in metric order) */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-1.5 py-0.2 rounded bg-neutral-800/80 text-[10px] font-mono font-medium text-success-400 border border-neutral-700/50">
                        #{row.peak_rank}
                      </span>
                    </td>

                    {/* 8. Streak & 7d/30d Presence */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {(() => {
                        const d7 = row.days_7d !== undefined ? row.days_7d : 0
                        const d30 = row.days_30d !== undefined ? row.days_30d : (row.trending_days || 1)
                        const streak = row.current_streak || 0
                        const maxStreak = row.max_streak_30d || 0

                        let badgeText = `📅 ${row.trending_days || 1}d`
                        let badgeStyle = 'bg-neutral-800/80 text-neutral-400 border-neutral-700/50'

                        if (d7 >= 4) {
                          badgeText = `🔥 ${d7}/7d`
                          badgeStyle = 'bg-error-500/15 text-error-400 border-error-500/30 font-bold'
                        } else if (streak >= 3) {
                          badgeText = `⚡ ${streak}d streak`
                          badgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold'
                        } else if (d7 >= 2) {
                          badgeText = `🟢 ${d7}/7d`
                          badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
                        } else if (d30 >= 10) {
                          badgeText = `👑 ${d30}/30d`
                          badgeStyle = 'bg-primary-500/15 text-primary-300 border-primary-500/30 font-semibold'
                        } else if (streak === 1 || d7 === 1) {
                          badgeText = `⚡ 1d`
                          badgeStyle = 'bg-neutral-800/80 text-neutral-300 border-neutral-700/60'
                        }

                        return (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${badgeStyle}`}
                            title={`Recent 7d: ${d7}/7 days | 30d: ${d30}/30 days | Active Streak: ${streak} days | Max Streak: ${maxStreak} days | Lifetime: ${row.trending_days || 1} days`}
                          >
                            {badgeText}
                          </span>
                        )
                      })()}
                    </td>

                    {/* 9. Language (6th in metric order) */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {row.language ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300">
                          {row.language}
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-xs">—</span>
                      )}
                    </td>

                    {/* 10. Category (7th in metric order) */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-primary-500/10 text-primary-300 border border-primary-500/20">
                        {row.ai_specs?.architecture_type || 'Full-Stack App'}
                      </span>
                    </td>

                    {/* 11. GitHub Link (8th in metric order) */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <a
                        href={`https://github.com/${row.repo_name}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 hover:border-neutral-600 transition-colors text-[11px] font-semibold shadow-sm"
                        title="Open on GitHub"
                      >
                        <span>GitHub</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-white" />
                      </a>
                    </td>
                  </tr>

                  {/* ─── Expandable AI Intelligence Card (Readiness & GitHub Link Removed) ─── */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={11} className="p-0 bg-neutral-950 border-y border-primary-500/30">
                        <div className="w-full px-4 sm:px-6 py-4 space-y-3.5 animate-in fade-in duration-150">
                          {/* Card Header: Repo Name & Architecture badge ONLY */}
                          <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary-400" />
                              <h4 className="font-bold text-neutral-50 text-sm">
                                {row.repo_name}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20">
                                {row.ai_specs?.architecture_type || 'Full-Stack App'}
                              </span>
                            </div>

                            <span className="text-neutral-500 text-[11px]">
                              License: <strong className="text-neutral-300">{row.ai_specs?.license_risk || 'Low (Standard OSS)'}</strong>
                            </span>
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

                          {/* Tech Stack Pills */}
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
                          </div>

                          {/* Rolling Momentum & Streak Stats */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            <span className="text-neutral-400 text-[11px] font-medium mr-1">Trending Presence:</span>
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-neutral-300">
                              7d Hotness: <strong className="text-primary-400">{row.days_7d !== undefined ? `${row.days_7d}/7d` : '—'}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-neutral-300">
                              30d Endurance: <strong className="text-emerald-400">{row.days_30d !== undefined ? `${row.days_30d}/30d` : '—'}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-neutral-300">
                              Active Streak: <strong className="text-amber-400">{row.current_streak ? `${row.current_streak}d in a row` : '0d'}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-neutral-300">
                              Max 30d Streak: <strong className="text-purple-400">{row.max_streak_30d ? `${row.max_streak_30d}d` : '—'}</strong>
                            </span>
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
              <td colSpan={11} className="px-4 py-12 text-center text-neutral-500">
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
