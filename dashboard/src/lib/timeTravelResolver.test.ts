import { describe, it, expect } from 'vitest'
import {
  extractAvailableSnapshotDates,
  resolveEffectiveSnapshotDate,
  resolveHistoricalSnapshotItems,
  calculateCoordinatedTimePeriodCounts,
} from './timeTravelResolver'
import type { UnifiedRepoItem, TrendingSnapshotItem } from '../types'

const mockRepositories: UnifiedRepoItem[] = [
  {
    repo_id: 'repo-1',
    repo_name: 'test/repo-alpha',
    owner: 'test',
    name: 'repo-alpha',
    stars_count: 5000,
    forks_count: 300,
    total_appearances: 5,
    peak_rank: 1,
    daily_appearances: 3,
    weekly_appearances: 1,
    monthly_appearances: 1,
    trending_power_score: 95.5,
    all_time_rank: 1,
    ai_specs: { architecture_type: 'AI/ML Framework', production_score: 88 },
  },
  {
    repo_id: 'repo-2',
    repo_name: 'test/repo-beta',
    owner: 'test',
    name: 'repo-beta',
    stars_count: 2000,
    forks_count: 100,
    total_appearances: 2,
    peak_rank: 2,
    daily_appearances: 2,
    weekly_appearances: 0,
    monthly_appearances: 0,
    trending_power_score: 65.0,
    all_time_rank: 2,
    ai_specs: { architecture_type: 'CLI Tool', production_score: 75 },
  },
  {
    repo_id: 'repo-3',
    repo_name: 'test/repo-gamma',
    owner: 'test',
    name: 'repo-gamma',
    stars_count: 12000,
    forks_count: 800,
    total_appearances: 1,
    peak_rank: 3,
    daily_appearances: 1,
    weekly_appearances: 0,
    monthly_appearances: 0,
    trending_power_score: 50.0,
    all_time_rank: 3,
    ai_specs: { architecture_type: 'Library/SDK', production_score: 90 },
  },
]

const mockSnapshots: TrendingSnapshotItem[] = [
  // 2026-11-06 Daily: repo-2 is #1 (+120), repo-1 is #2 (+85)
  {
    id: 's1',
    repo_id: 'repo-2',
    rank: 1,
    period: 'daily',
    stars_today: 120,
    recorded_at: '2026-11-06T12:00:00Z',
  },
  {
    id: 's2',
    repo_id: 'repo-1',
    rank: 2,
    period: 'daily',
    stars_today: 85,
    recorded_at: '2026-11-06T12:00:00Z',
  },
  // Duplicate run on 2026-11-06 Daily: repo-1 improved to #1
  {
    id: 's3',
    repo_id: 'repo-1',
    rank: 1,
    period: 'daily',
    stars_today: 95,
    recorded_at: '2026-11-06T18:00:00Z',
  },
  // 2026-11-05 Daily: repo-3 was #1 (+300)
  {
    id: 's4',
    repo_id: 'repo-3',
    rank: 1,
    period: 'daily',
    stars_today: 300,
    recorded_at: '2026-11-05T10:00:00Z',
  },
  // 2026-11-06 Weekly: repo-1 is #1
  {
    id: 's5',
    repo_id: 'repo-1',
    rank: 1,
    period: 'weekly',
    stars_today: 500,
    recorded_at: '2026-11-06T12:00:00Z',
  },
]

describe('Time Travel Snapshot Resolver (Unit & Integration Tests)', () => {
  describe('extractAvailableSnapshotDates', () => {
    it('returns empty array when snapshots are empty or invalid', () => {
      expect(extractAvailableSnapshotDates([], 'daily')).toEqual([])
      expect(extractAvailableSnapshotDates(null as any, 'daily')).toEqual([])
    })

    it('extracts unique dates sorted newest first for daily period', () => {
      const dates = extractAvailableSnapshotDates(mockSnapshots, 'daily')
      expect(dates).toEqual(['2026-11-06', '2026-11-05'])
    })

    it('extracts dates only for weekly period', () => {
      const dates = extractAvailableSnapshotDates(mockSnapshots, 'weekly')
      expect(dates).toEqual(['2026-11-06'])
    })

    it('returns empty array for periods with no snapshots', () => {
      const dates = extractAvailableSnapshotDates(mockSnapshots, 'monthly')
      expect(dates).toEqual([])
    })
  })

  describe('resolveEffectiveSnapshotDate', () => {
    it('returns selected date if present in available dates', () => {
      const date = resolveEffectiveSnapshotDate('2026-11-05', ['2026-11-06', '2026-11-05'])
      expect(date).toBe('2026-11-05')
    })

    it('falls back to newest available date if selected date is missing or invalid', () => {
      const date = resolveEffectiveSnapshotDate('2026-10-01', ['2026-11-06', '2026-11-05'])
      expect(date).toBe('2026-11-06')
      expect(resolveEffectiveSnapshotDate('', ['2026-11-06'])).toBe('2026-11-06')
      expect(resolveEffectiveSnapshotDate(null, ['2026-11-06'])).toBe('2026-11-06')
    })

    it('returns empty string when available dates array is empty', () => {
      expect(resolveEffectiveSnapshotDate('2026-11-06', [])).toBe('')
    })
  })

  describe('resolveHistoricalSnapshotItems', () => {
    it('returns all repositories directly when period is "all"', () => {
      const items = resolveHistoricalSnapshotItems(mockRepositories, mockSnapshots, 'all', '2026-11-06')
      expect(items.length).toBe(3)
      expect(items[0].repo_id).toBe('repo-1')
    })

    it('resolves historical snapshot for 2026-11-06 daily and deduplicates keeping best rank', () => {
      const items = resolveHistoricalSnapshotItems(mockRepositories, mockSnapshots, 'daily', '2026-11-06')
      expect(items.length).toBe(2)
      // repo-1 and repo-2 both had rank 1 (repo-1 was updated in second run)
      const repoIds = items.map((r) => r.repo_id)
      expect(repoIds).toContain('repo-1')
      expect(repoIds).toContain('repo-2')
      expect(items[0].snapshot_date).toBe('2026-11-06')
      expect(items[0].latest_period).toBe('daily')
    })

    it('resolves historical snapshot for past date 2026-11-05 daily showing only repo-3', () => {
      const items = resolveHistoricalSnapshotItems(mockRepositories, mockSnapshots, 'daily', '2026-11-05')
      expect(items.length).toBe(1)
      expect(items[0].repo_id).toBe('repo-3')
      expect(items[0].snapshot_rank).toBe(1)
      expect(items[0].stars_today).toBe(300)
    })

    it('gracefully handles missing snapshots or invalid dates', () => {
      const items = resolveHistoricalSnapshotItems(mockRepositories, [], 'daily', '')
      expect(items.length).toBe(3) // falls back to repos with daily_appearances > 0
    })
  })

  describe('calculateCoordinatedTimePeriodCounts', () => {
    it('calculates exact distinct repo counts per period', () => {
      const counts = calculateCoordinatedTimePeriodCounts(
        mockRepositories,
        mockSnapshots,
        'daily',
        '2026-11-06'
      )
      expect(counts.all).toBe(3)
      expect(counts.daily).toBe(2) // 2 unique repos on 2026-11-06
      expect(counts.weekly).toBe(1) // 1 unique repo on weekly
      expect(counts.monthly).toBe(0)
    })

    it('updates daily count dynamically when viewing 2026-11-05', () => {
      const counts = calculateCoordinatedTimePeriodCounts(
        mockRepositories,
        mockSnapshots,
        'daily',
        '2026-11-05'
      )
      expect(counts.daily).toBe(1) // only repo-3 on 2026-11-05
    })
  })
})

