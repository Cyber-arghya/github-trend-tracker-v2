import React, { useState } from 'react'
import { Calendar, Star, GitFork, ExternalLink, Zap } from 'lucide-react'
import type { TrendingSnapshot } from '../../types'

interface SnapshotsTabProps {
  snapshots: TrendingSnapshot[]
  isLoading: boolean
  onSelectReadme?: (url: string, repoName: string) => void
}

export const SnapshotsTab: React.FC<SnapshotsTabProps> = ({
  snapshots,
  isLoading,
  onSelectReadme,
}) => {
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const filteredSnapshots = snapshots.filter((s) => s.period === activePeriod)

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5">
          {(['daily', 'weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activePeriod === period
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 pr-2">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>Showing {filteredSnapshots.length} trending repos</span>
        </div>
      </div>

      {/* Snapshots Grid */}
      {isLoading && snapshots.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : filteredSnapshots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSnapshots.map((item) => {
            const repo = item.repositories
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs font-bold">
                      #{item.rank}
                    </span>
                    {item.stars_today > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
                        <Zap className="w-3 h-3" />
                        +{item.stars_today.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <a
                    href={`https://github.com/${repo?.repo_name || ''}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-slate-100 hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-base"
                  >
                    <span className="truncate">{repo?.repo_name || 'Unknown Repo'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                  </a>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 mb-3">
                    {repo?.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    {repo?.language && (
                      <span className="text-[11px] font-medium text-slate-300">
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                      {repo?.stars_count?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <GitFork className="w-3 h-3 text-slate-400" />
                      {repo?.forks_count?.toLocaleString() || 0}
                    </span>
                  </div>

                  {repo?.readme_storage_url && onSelectReadme && (
                    <button
                      onClick={() => onSelectReadme(repo.readme_storage_url!, repo.repo_name)}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      README
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 rounded-xl border border-dashed border-slate-800">
          No snapshots recorded yet for this period. Run the scraper pipeline to populate data.
        </div>
      )}
    </div>
  )
}

