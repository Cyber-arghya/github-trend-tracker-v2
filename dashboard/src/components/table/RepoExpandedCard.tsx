import React from 'react'
import { Sparkles, Terminal, Copy, Check, ChevronUp } from 'lucide-react'
import type { UnifiedRepoItem } from '../../types'

export interface RepoExpandedCardProps {
  row: UnifiedRepoItem
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  onCollapse: (id: string) => void
}

export const RepoExpandedCard: React.FC<RepoExpandedCardProps> = ({
  row,
  copiedId,
  onCopy,
  onCollapse,
}) => {
  return (
    <div className="mx-1 sm:mx-3 my-2 sm:my-2.5 rounded-xl border-2 border-primary-500/40 bg-neutral-900/95 shadow-2xl overflow-hidden">
      {/* ─── Top Header Ribbon (Start of AI Specs) ─── */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-primary-950/70 via-neutral-900 to-neutral-900 border-b border-primary-500/30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-primary-500/20 text-primary-400 border border-primary-500/30 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap truncate">
            <span className="text-xs font-bold text-neutral-100">
              AI Intelligence Specs
            </span>
            <span className="text-primary-400 font-mono text-xs font-semibold truncate">
              · {row.repo_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/30 text-[10px] font-mono">
            {row.ai_specs?.architecture_type || 'Full-Stack App'}
          </span>
          <span className="text-neutral-400 text-[11px] hidden md:inline">
            License: <strong className="text-neutral-200">{row.ai_specs?.license_risk || 'Low (Standard OSS)'}</strong>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onCollapse(row.repo_id)
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
            title="Collapse AI specs"
          >
            <span>Collapse</span>
            <ChevronUp className="w-3 h-3 text-primary-400" />
          </button>
        </div>
      </div>

      {/* ─── Body Content ─── */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Value Proposition */}
        <div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
            Value Proposition:
          </span>
          <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed bg-neutral-950/80 p-2.5 sm:p-3 rounded-lg border border-neutral-800 shadow-inner">
            "{row.ai_specs?.key_value_proposition || row.description || 'No summary available.'}"
          </p>
        </div>

        {/* Tech Stack Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs">
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
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 text-xs">
          <span className="text-neutral-400 text-[11px] font-medium mr-1">Trending Presence:</span>
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300">
            7d Hotness: <strong className="text-primary-400">{row.days_7d !== undefined ? `${row.days_7d}/7d` : '—'}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300">
            30d Endurance: <strong className="text-emerald-400">{row.days_30d !== undefined ? `${row.days_30d}/30d` : '—'}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300">
            Active Streak: <strong className="text-amber-400">{row.current_streak ? `${row.current_streak}d in a row` : '0d'}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300">
            Max 30d Streak: <strong className="text-purple-400">{row.max_streak_30d ? `${row.max_streak_30d}d` : '—'}</strong>
          </span>
        </div>

        {/* Quick Start Command */}
        {row.ai_specs?.quick_start_command && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Terminal className="w-3.5 h-3.5 text-primary-400 shrink-0" />
              <span className="truncate">{row.ai_specs.quick_start_command}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onCopy(row.ai_specs!.quick_start_command!, row.repo_id)
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
    </div>
  )
}
