import React from 'react'
import { Star, ChevronDown, ChevronUp, Heart, ExternalLink } from 'lucide-react'
import type { UnifiedRepoItem, TimeFilter } from '../../types'
import {
  getPowerScoreStyle,
  getReadinessStyle,
  getRankBadgeStyle,
  getStreakBadgeInfo,
} from '../../lib/tableStyles'
import { RepoExpandedCard } from './RepoExpandedCard'

export interface RepoTableRowProps {
  row: UnifiedRepoItem
  timeFilter: TimeFilter
  effectiveDate: string
  isExpanded: boolean
  isFavorite: boolean
  maxObservedScore: number
  copiedId: string | null
  onToggleExpand: (id: string) => void
  onToggleFavorite: (id: string) => void
  onCopy: (text: string, id: string) => void
}

export const RepoTableRow: React.FC<RepoTableRowProps> = ({
  row,
  timeFilter,
  effectiveDate,
  isExpanded,
  isFavorite,
  maxObservedScore,
  copiedId,
  onToggleExpand,
  onToggleFavorite,
  onCopy,
}) => {
  const displayRank =
    timeFilter !== 'all' && row.snapshot_rank ? row.snapshot_rank : row.all_time_rank
  const starsToday = row.stars_today || 0
  const isBreakout = starsToday >= 1000
  const isSurging = starsToday >= 500 && starsToday < 1000
  const prodScore = row.ai_specs?.production_score || 75
  const scoreStyle = getPowerScoreStyle(row.trending_power_score)
  const rankBadge = getRankBadgeStyle(displayRank)
  const streakInfo = getStreakBadgeInfo(
    row.days_7d,
    row.days_30d,
    row.current_streak,
    row.max_streak_30d,
    row.trending_days
  )

  return (
    <React.Fragment>
      {/* Main Row: Click anywhere to toggle AI specs */}
      <tr
        className={`transition-colors cursor-pointer group select-none ${
          isExpanded
            ? 'bg-neutral-800/90 border-l-4 border-l-primary-500 shadow-lg ring-1 ring-primary-500/30'
            : 'hover:bg-neutral-800/50'
        }`}
        onClick={() => onToggleExpand(row.repo_id)}
        title={isExpanded ? 'Click to collapse AI specs' : 'Click to expand AI intelligence specs'}
      >
        {/* 1. Rank (Always visible) */}
        <td className="px-2 sm:px-3 py-2.5 font-mono font-bold whitespace-nowrap">
          <span
            className={`px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-semibold ${rankBadge.badgeClass}`}
            title={
              row.snapshot_rank
                ? `Rank #${row.snapshot_rank} on ${row.snapshot_date || effectiveDate} (${row.latest_period || 'daily'})`
                : `All-Time Rank #${row.all_time_rank}`
            }
          >
            {rankBadge.icon ? `${rankBadge.icon} #${displayRank}` : `#${displayRank}`}
          </span>
        </td>

        {/* 2. Repository Name ONLY (Always visible) */}
        <td className="px-2 sm:px-3 py-2.5 max-w-[150px] sm:max-w-xs md:max-w-sm">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold transition-colors text-xs sm:text-sm truncate ${
                isExpanded ? 'text-primary-300' : 'text-neutral-100 group-hover:text-primary-400'
              }`}
            >
              {row.repo_name}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-primary-400 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 shrink-0 transition-transform" />
            )}
          </div>
        </td>

        {/* 3. Favorite Action Button (Always visible) */}
        <td className="px-1 sm:px-2 py-2.5 text-center whitespace-nowrap">
          <button
            type="button"
            data-testid={`fav-btn-${row.repo_id}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(row.repo_id)
            }}
            className={`p-1 rounded-md transition-all ${
              isFavorite
                ? 'text-rose-500 opacity-100 hover:text-rose-400 hover:scale-110'
                : 'text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-neutral-800'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'fill-transparent'
              }`}
            />
          </button>
        </td>

        {/* 4. Total Stars (Always visible) */}
        <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap font-mono text-neutral-200">
          <div className="flex items-center gap-1 font-semibold text-xs">
            <Star className="w-3 h-3 text-warning-400 fill-warning-400/20" />
            <span>{row.stars_count.toLocaleString()}</span>
          </div>
        </td>

        {/* 5. Readiness (Hidden on Mobile < 640px, visible on sm+) */}
        <td className="hidden sm:table-cell px-2 sm:px-3 py-2.5 whitespace-nowrap font-mono">
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getReadinessStyle(prodScore)}`}>
            {prodScore}/100
          </span>
        </td>

        {/* 6. Trend Power (Hidden on Mobile & Tablet sm, visible on md+) */}
        <td className="hidden md:table-cell px-2 sm:px-3 py-2.5 whitespace-nowrap font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-12 text-right ${scoreStyle.text}`}>
              {row.trending_power_score.toFixed(1)}
            </span>
            <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden shrink-0">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreStyle.bar}`}
                style={{
                  width: `${Math.min(100, Math.max(5, (row.trending_power_score / maxObservedScore) * 100))}%`,
                }}
              />
            </div>
          </div>
        </td>

        {/* 7. Velocity (Hidden on Mobile & Tablet sm, visible on md+) */}
        <td className="hidden md:table-cell px-2 sm:px-3 py-2.5 whitespace-nowrap font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-semibold ${
                isBreakout
                  ? 'text-error-400 font-bold'
                  : isSurging
                  ? 'text-warning-400 font-medium'
                  : 'text-neutral-300'
              }`}
            >
              +{starsToday.toLocaleString()}/day
            </span>
            {isBreakout && (
              <span
                className="inline-flex items-center px-1 py-0.2 text-[10px] font-bold rounded bg-error-500/20 text-error-400 border border-error-500/30"
                title="Breakout (>1000 stars/day)"
              >
                🔥
              </span>
            )}
            {isSurging && (
              <span
                className="inline-flex items-center px-1 py-0.2 text-[10px] font-bold rounded bg-warning-500/20 text-warning-400 border border-warning-500/30"
                title="Surge (>500 stars/day)"
              >
                ⚡
              </span>
            )}
          </div>
        </td>

        {/* 8. Peak (Hidden on Mobile & Tablet, visible on lg+) */}
        <td className="hidden lg:table-cell px-3 py-2.5 whitespace-nowrap">
          <span className="px-1.5 py-0.2 rounded bg-neutral-800/80 text-[10px] font-mono font-medium text-success-400 border border-neutral-700/50">
            #{row.peak_rank}
          </span>
        </td>

        {/* 9. Streak & 7d Presence (Hidden on Mobile & Tablet, visible on lg+) */}
        <td className="hidden lg:table-cell px-3 py-2.5 whitespace-nowrap">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${streakInfo.style}`}
            title={streakInfo.title}
          >
            {streakInfo.text}
          </span>
        </td>

        {/* 10. Language (Hidden on Mobile & Tablet, visible on lg+) */}
        <td className="hidden lg:table-cell px-3 py-2.5 whitespace-nowrap">
          {row.language ? (
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] font-mono">
              {row.language}
            </span>
          ) : (
            <span className="text-neutral-500 text-[11px]">Markdown</span>
          )}
        </td>

        {/* 11. Category (Hidden on Mobile & Tablet, visible on lg+) */}
        <td className="hidden lg:table-cell px-3 py-2.5 whitespace-nowrap">
          <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-300 border border-neutral-800 text-[11px] font-medium">
            {row.ai_specs?.architecture_type || 'Full-Stack App'}
          </span>
        </td>

        {/* 12. GitHub Link (Always visible) */}
        <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap text-right">
          <a
            href={`https://github.com/${row.repo_name}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-neutral-100 transition-colors text-xs font-medium"
          >
            <span className="hidden xs:inline">GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </td>
      </tr>

      {/* Expanded Row: Shared AI Specs Card */}
      {isExpanded && (
        <tr className="bg-neutral-950/80">
          <td colSpan={12} className="p-0 border-y border-primary-500/30">
            <RepoExpandedCard
              row={row}
              copiedId={copiedId}
              onCopy={onCopy}
              onCollapse={onToggleExpand}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  )
}

