import React from 'react'
import { Flame, Database, RefreshCw, Calendar, Zap } from 'lucide-react'

interface HeaderProps {
  totalTracked: number
  breakoutCount: number
  multiDayCount?: number
  activeStreaksCount?: number
  isLoading: boolean
  onRefresh: () => void
}

export const Header: React.FC<HeaderProps> = ({
  totalTracked,
  breakoutCount,
  multiDayCount = 0,
  activeStreaksCount = 0,
  isLoading,
  onRefresh,
}) => {
  return (
    <header className="relative w-full border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md">
      <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Brand - Clean without redundant pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20 text-neutral-950 font-black text-xs tracking-wider">
              V2
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-neutral-50">GitHub Trend Tracker</h1>
          </div>

          {/* Quick Stats & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300">
              <Database className="w-3.5 h-3.5 text-primary-400" />
              <span>Tracked: <strong className="text-neutral-50">{totalTracked}</strong></span>
            </div>

            {breakoutCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning-500/10 border border-warning-500/30 text-xs text-warning-400 font-medium">
                <Flame className="w-3.5 h-3.5 text-warning-400 animate-pulse" />
                <span>Breakouts: <strong>{breakoutCount}</strong></span>
              </div>
            )}

            {multiDayCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sustained (3d+): <strong>{multiDayCount}</strong></span>
              </div>
            )}

            {activeStreaksCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-500/10 border border-primary-500/30 text-xs text-primary-300 font-medium hidden md:flex">
                <Zap className="w-3.5 h-3.5 text-primary-400" />
                <span>Active Streaks: <strong>{activeStreaksCount}</strong></span>
              </div>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-neutral-50 transition-all disabled:opacity-50"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
