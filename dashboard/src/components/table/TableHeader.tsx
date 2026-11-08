import React from 'react'
import { TrendingUp, Star, Flame, Calendar, Heart } from 'lucide-react'
import type { SortOption } from '../../types'

export interface TableHeaderProps {
  sortBy: SortOption
  sortAsc: boolean
  onSort: (field: SortOption) => void
}

export const TableHeader: React.FC<TableHeaderProps> = ({ sortBy, onSort }) => {
  return (
    <thead className="bg-neutral-950 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 shadow-sm">
      <tr>
        {/* 1. Rank (Always visible) */}
        <th
          className="sticky top-0 z-30 bg-neutral-950 px-2 sm:px-3 py-2.5 w-12 sm:w-14 cursor-pointer select-none border-b border-neutral-800"
          onClick={() => onSort('rank')}
        >
          <div className="flex items-center gap-1 hover:text-neutral-100">
            <span>Rank</span>
            {sortBy === 'rank' && <TrendingUp className="w-3 h-3 text-primary-400" />}
          </div>
        </th>

        {/* 2. Repository (Always visible) */}
        <th className="sticky top-0 z-30 bg-neutral-950 px-2 sm:px-3 py-2.5 min-w-[140px] sm:min-w-[200px] border-b border-neutral-800">
          Repository
        </th>

        {/* 3. Favorite Action (Always visible) */}
        <th
          className="sticky top-0 z-30 bg-neutral-950 px-1 sm:px-2 py-2.5 w-8 sm:w-10 text-center border-b border-neutral-800 select-none"
          title="Favorite"
        >
          <Heart className="w-3.5 h-3.5 text-neutral-400 mx-auto" />
        </th>

        {/* 4. Total Stars (Always visible) */}
        <th
          className="sticky top-0 z-30 bg-neutral-950 px-2 sm:px-3 py-2.5 w-20 sm:w-24 cursor-pointer select-none border-b border-neutral-800"
          onClick={() => onSort('stars')}
        >
          <div className="flex items-center gap-1 hover:text-neutral-100">
            <Star className="w-3 h-3 text-warning-400 fill-warning-400/20" />
            <span>Stars</span>
          </div>
        </th>

        {/* 5. Readiness (Hidden on Mobile < 640px, visible on sm+) */}
        <th
          className="hidden sm:table-cell sticky top-0 z-30 bg-neutral-950 px-2 sm:px-3 py-2.5 w-20 sm:w-24 cursor-pointer select-none border-b border-neutral-800"
          onClick={() => onSort('readiness')}
        >
          <div className="flex items-center gap-1 hover:text-neutral-100">
            <span>Readiness</span>
          </div>
        </th>

        {/* 6. Trend Power (Hidden on Mobile & Tablet sm, visible on md+) */}
        <th
          className="hidden md:table-cell sticky top-0 z-30 bg-neutral-950 px-2 sm:px-3 py-2.5 w-28 sm:w-32 cursor-pointer select-none border-b border-neutral-800"
          onClick={() => onSort('power_score')}
        >
          <div className="flex items-center gap-1 hover:text-neutral-100">
            <span>Trend Power</span>
          </div>
        </th>

        {/* 7. Velocity (Hidden on Mobile & Tablet sm, visible on md+) */}
        <th
          className="hidden md:table-cell sticky top-0 z-30 bg-neutral-950 px-2 sm:px-3 py-2.5 w-28 sm:w-32 cursor-pointer select-none border-b border-neutral-800"
          onClick={() => onSort('growth_velocity')}
        >
          <div className="flex items-center gap-1 hover:text-neutral-100">
            <span>Velocity</span>
            <Flame className="w-3 h-3 text-warning-400" />
          </div>
        </th>

        {/* 8. Peak (Hidden on Mobile & Tablet, visible on lg+) */}
        <th
          className="hidden lg:table-cell sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-16 cursor-pointer select-none border-b border-neutral-800"
          onClick={() => onSort('peak')}
        >
          <div className="flex items-center gap-1 hover:text-neutral-100">
            <span>Peak</span>
          </div>
        </th>

        {/* 9. Streak & 7d Presence (Hidden on Mobile & Tablet, visible on lg+) */}
        <th
          className="hidden lg:table-cell sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-24 cursor-pointer select-none border-b border-neutral-800"
          onClick={() => onSort('days_7d')}
        >
          <div className="flex items-center gap-1 hover:text-neutral-100" title="Recent 7-day presence & active streaks">
            <span>Streak / 7d</span>
            <Calendar className="w-3 h-3 text-primary-400" />
          </div>
        </th>

        {/* 10. Language (Hidden on Mobile & Tablet, visible on lg+) */}
        <th className="hidden lg:table-cell sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-24 border-b border-neutral-800">
          Language
        </th>

        {/* 11. Category (Hidden on Mobile & Tablet, visible on lg+) */}
        <th className="hidden lg:table-cell sticky top-0 z-30 bg-neutral-950 px-3 py-2.5 w-36 border-b border-neutral-800">
          Category
        </th>

        {/* 12. GitHub Link (Always visible) */}
        <th className="sticky top-0 z-30 bg-neutral-950 px-2 sm:px-3 py-2.5 w-16 sm:w-24 text-right border-b border-neutral-800">
          GitHub
        </th>
      </tr>
    </thead>
  )
}
