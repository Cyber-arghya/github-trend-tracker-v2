import React from 'react'
import { Flame, Database, RefreshCw } from 'lucide-react'

interface HeaderProps {
  totalTracked: number
  breakoutCount: number
  isLoading: boolean
  onRefresh: () => void
}

export const Header: React.FC<HeaderProps> = ({
  totalTracked,
  breakoutCount,
  isLoading,
  onRefresh,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 w-full">
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-xs tracking-wider">
              V2
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">GitHub Trend Tracker</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:inline-block">
                VC Radar
              </span>
            </div>
          </div>

          {/* Quick Stats & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tracked: <strong className="text-white">{totalTracked}</strong></span>
            </div>

            {breakoutCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Breakouts: <strong>{breakoutCount}</strong></span>
              </div>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
