import React from 'react'
import { Star, Flame, ExternalLink, Heart, ChevronDown, ChevronUp } from 'lucide-react'
import type { UnifiedRepoItem, TimeFilter } from '../../types'
import {
  getPowerScoreStyle,
  getReadinessStyle,
  getRankBadgeStyle,
  getStreakBadgeInfo,
} from '../../lib/tableStyles'
import { RepoExpandedCard } from './RepoExpandedCard'

export interface RepoMobileCardProps {
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

export const RepoMobileCard: React.FC<RepoMobileCardProps> = ({
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
    <div
      className={`rounded-xl border transition-all ${
        isExpanded
          ? 'bg-neutral-800/90 border-primary-500/50 shadow-lg ring-1 ring-primary-500/20'
          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Card Header: Rank, Repo Name, Favorite, External Link */}
      <div
        className="p-3 cursor-pointer select-none space-y-2.5"
        onClick={() => onToggleExpand(row.repo_id)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Rank */}
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-semibold shrink-0 font-mono ${rankBadge.badgeClass}`}
              title={
                row.snapshot_rank
                  ? `Rank #${row.snapshot_rank} on ${row.snapshot_date || effectiveDate}`
                  : `All-Time Rank #${row.all_time_rank}`
              }
            >
              {rankBadge.icon ? `${rankBadge.icon} #${displayRank}` : `#${displayRank}`}
            </span>

            {/* Repo Name */}
            <span
              className={`font-bold text-xs sm:text-sm truncate transition-colors ${
                isExpanded ? 'text-primary-300' : 'text-neutral-100'
              }`}
            >
              {row.repo_name}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Favorite Button */}
            <button
              type="button"
              data-testid={`fav-btn-mobile-${row.repo_id}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(row.repo_id)
              }}
              className={`p-1.5 rounded-md transition-all ${
                isFavorite
                  ? 'text-rose-500 hover:scale-110'
                  : 'text-neutral-500 hover:text-rose-400 hover:bg-neutral-800'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : 'fill-transparent'
                }`}
              />
            </button>

            {/* GitHub External Link */}
            <a
              href={`https://github.com/${row.repo_name}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              title="Open GitHub repository"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Expand / Collapse Chevron */}
            <div className="p-1 text-neutral-400">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-primary-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              )}
            </div>
          </div>
        </div>

        {/* Value Proposition Preview */}
        {row.ai_specs?.key_value_proposition && (
          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
            {row.ai_specs.key_value_proposition}
          </p>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 pt-1 border-t border-neutral-800/60 text-xs">
          {/* Stars */}
          <div className="flex items-center gap-1.5 font-mono">
            <Star className="w-3 h-3 text-warning-400 fill-warning-400/20" />
            <span className="font-semibold text-neutral-200">
              {row.stars_count.toLocaleString()}
            </span>
          </div>

          {/* Velocity */}
          <div className="flex items-center gap-1 font-mono">
            <span
              className={`font-semibold ${
                isBreakout
                  ? 'text-error-400 font-bold'
                  : isSurging
                  ? 'text-warning-400 font-medium'
                  : 'text-neutral-300'
              }`}
            >
              +{starsToday.toLocaleString()}/d
            </span>
            {isBreakout && <Flame className="w-3 h-3 text-error-400 animate-pulse" />}
            {isSurging && <span className="text-[10px]">⚡</span>}
          </div>

          {/* Trend Power */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className={`text-[11px] ${scoreStyle.text}`}>
              TP: {row.trending_power_score.toFixed(1)}
            </span>
            <div className="w-10 h-1 bg-neutral-800 rounded-full overflow-hidden shrink-0">
              <div
                className={`h-full rounded-full ${scoreStyle.bar}`}
                style={{
                  width: `${Math.min(100, Math.max(5, (row.trending_power_score / maxObservedScore) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Readiness */}
          <div className="font-mono">
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${getReadinessStyle(prodScore)}`}>
              Ready: {prodScore}
            </span>
          </div>

          {/* Streak */}
          <div>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${streakInfo.style}`}
              title={streakInfo.title}
            >
              {streakInfo.text}
            </span>
          </div>

          {/* Category & Language */}
          <div className="truncate flex items-center gap-1 text-[10px]">
            <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 truncate">
              {row.ai_specs?.architecture_type || 'App'}
            </span>
            {row.language && (
              <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 truncate">
                {row.language}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Shared AI Specs Card */}
      {isExpanded && (
        <div className="p-2 border-t border-primary-500/30 bg-neutral-950/60">
          <RepoExpandedCard
            row={row}
            copiedId={copiedId}
            onCopy={onCopy}
            onCollapse={onToggleExpand}
          />
        </div>
      )}
    </div>
  )
}
