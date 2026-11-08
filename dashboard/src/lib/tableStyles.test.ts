import { describe, it, expect } from 'vitest'
import {
  getPowerScoreStyle,
  getReadinessStyle,
  getRankBadgeStyle,
  getStreakBadgeInfo,
} from './tableStyles'

describe('tableStyles (Unit Tests)', () => {
  it('returns bright emerald for high power scores', () => {
    const high = getPowerScoreStyle(140)
    expect(high.text).toContain('emerald-400')
    expect(high.bar).toContain('emerald-400')
  })

  it('returns neutral style for low power scores', () => {
    const low = getPowerScoreStyle(20)
    expect(low.text).toContain('neutral-400')
    expect(low.bar).toContain('neutral-600')
  })

  it('returns correct readiness styling thresholds', () => {
    expect(getReadinessStyle(90)).toContain('emerald')
    expect(getReadinessStyle(75)).toContain('amber')
    expect(getReadinessStyle(50)).toContain('rose')
  })

  it('returns top 3 rank badges with medal icons', () => {
    const rank1 = getRankBadgeStyle(1)
    expect(rank1.icon).toBe('🥇')

    const rank2 = getRankBadgeStyle(2)
    expect(rank2.icon).toBe('🥈')

    const rank3 = getRankBadgeStyle(3)
    expect(rank3.icon).toBe('🥉')

    const rank4 = getRankBadgeStyle(4)
    expect(rank4.icon).toBeNull()
  })

  it('formats streak and 7d presence badges accurately', () => {
    const high7d = getStreakBadgeInfo(5, 10, 2, 5, 20)
    expect(high7d.text).toBe('🔥 5/7d')

    const activeStreak = getStreakBadgeInfo(2, 5, 4, 4, 10)
    expect(activeStreak.text).toBe('⚡ 4d streak')

    const green7d = getStreakBadgeInfo(2, 4, 1, 3, 5)
    expect(green7d.text).toBe('🟢 2/7d')

    const king30d = getStreakBadgeInfo(1, 15, 0, 5, 15)
    expect(king30d.text).toBe('👑 15/30d')
  })
})
