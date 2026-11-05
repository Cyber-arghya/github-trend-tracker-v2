import React, { useState } from 'react'
import { Terminal, Shield, Star, ExternalLink, Copy, Check } from 'lucide-react'
import type { LeaderboardItem } from '../../types'

interface CatalogTabProps {
  repos: LeaderboardItem[]
  isLoading: boolean
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  repos,
  isLoading,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      {isLoading && repos.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : repos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((repo) => {
            const ai = repo.ai_specs
            const prodScore = ai?.production_score ?? 75

            return (
              <div
                key={repo.repo_id}
                className="flex flex-col justify-between p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  {/* Top Bar: Arch Pill & Score */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                      {ai?.architecture_type || 'Full-Stack App'}
                    </span>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-400">Readiness:</span>
                      <strong className={prodScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                        {prodScore}/100
                      </strong>
                    </div>
                  </div>

                  {/* Title & Stars */}
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={`https://github.com/${repo.repo_name}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lg font-bold text-white hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                    >
                      {repo.repo_name}
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </a>

                    <div className="flex items-center gap-1 text-xs font-mono text-slate-300 shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                      <span>{repo.stars_count.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Key Value Proposition */}
                  <p className="text-sm text-slate-300 mt-2 mb-3 leading-relaxed">
                    {ai?.key_value_proposition || repo.description || 'No description available.'}
                  </p>

                  {/* Tech Stack Pills */}
                  {ai?.tech_stack && ai.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {ai.tech_stack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[11px] font-medium text-slate-300 border border-slate-700/60"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Start Command */}
                  {ai?.quick_start_command && (
                    <div className="mt-3 p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-300">
                      <div className="flex items-center gap-2 overflow-x-auto">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{ai.quick_start_command}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(ai.quick_start_command!, repo.repo_id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Copy Command"
                      >
                        {copiedId === repo.repo_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>License: <strong className="text-slate-300">{ai?.license_risk || 'Standard OSS'}</strong></span>

                  <a
                    href={`https://github.com/${repo.repo_name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 rounded-xl border border-dashed border-slate-800">
          No repositories in catalog. Run the scraper pipeline to populate data.
        </div>
      )}
    </div>
  )
}
