/**
 * Shared styling utilities for repository tables, cards, and metric indicators.
 */

export interface PowerScoreStyle {
  bar: string
  text: string
}

export function getPowerScoreStyle(score: number): PowerScoreStyle {
  if (score >= 130) {
    return {
      bar: 'bg-emerald-400 shadow-sm shadow-emerald-500/30',
      text: 'text-emerald-400 font-bold',
    }
  }
  if (score >= 95) {
    return {
      bar: 'bg-emerald-500/80',
      text: 'text-emerald-400 font-semibold',
    }
  }
  if (score >= 65) {
    return {
      bar: 'bg-amber-400/90',
      text: 'text-amber-400 font-semibold',
    }
  }
  if (score >= 35) {
    return {
      bar: 'bg-amber-500/80',
      text: 'text-amber-400/90 font-medium',
    }
  }
  return {
    bar: 'bg-neutral-600',
    text: 'text-neutral-400 font-normal',
  }
}

export function getReadinessStyle(score: number): string {
  if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
  if (score >= 70) return 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
  return 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
}

export interface RankBadgeInfo {
  badgeClass: string
  icon: string | null
}

export function getRankBadgeStyle(displayRank: number): RankBadgeInfo {
  if (displayRank === 1) {
    return {
      badgeClass: 'bg-warning-500/20 text-warning-400 border border-warning-500/40',
      icon: '🥇',
    }
  }
  if (displayRank === 2) {
    return {
      badgeClass: 'bg-neutral-300/20 text-neutral-200 border border-neutral-300/40',
      icon: '🥈',
    }
  }
  if (displayRank === 3) {
    return {
      badgeClass: 'bg-warning-700/20 text-warning-500 border border-warning-700/40',
      icon: '🥉',
    }
  }
  return {
    badgeClass: 'bg-neutral-800 text-neutral-300 border border-neutral-700/50',
    icon: null,
  }
}

export interface StreakBadgeInfo {
  text: string
  style: string
  title: string
}

export function getStreakBadgeInfo(
  d7: number = 0,
  d30: number = 1,
  streak: number = 0,
  maxStreak: number = 0,
  lifetime: number = 1
): StreakBadgeInfo {
  let text = `📅 ${lifetime}d`
  let style = 'bg-neutral-800/80 text-neutral-400 border-neutral-700/50'

  if (d7 >= 4) {
    text = `🔥 ${d7}/7d`
    style = 'bg-error-500/15 text-error-400 border-error-500/30 font-bold'
  } else if (streak >= 3) {
    text = `⚡ ${streak}d streak`
    style = 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold'
  } else if (d7 >= 2) {
    text = `🟢 ${d7}/7d`
    style = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
  } else if (d30 >= 10) {
    text = `👑 ${d30}/30d`
    style = 'bg-primary-500/15 text-primary-300 border-primary-500/30 font-semibold'
  } else if (streak === 1 || d7 === 1) {
    text = `⚡ 1d`
    style = 'bg-neutral-800/80 text-neutral-300 border-neutral-700/60'
  }

  const title = `Recent 7d: ${d7}/7 days | 30d: ${d30}/30 days | Active Streak: ${streak} days | Max Streak: ${maxStreak} days | Lifetime: ${lifetime} days`
  return { text, style, title }
}

