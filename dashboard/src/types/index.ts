export interface AISpecs {
  key_value_proposition?: string
  architecture_type?: string
  tech_stack?: string[]
  license_risk?: string
  production_score?: number
  quick_start_command?: string
}

export interface UnifiedRepoItem {
  repo_id: string
  repo_name: string
  owner: string
  name: string
  description?: string
  language?: string
  stars_count: number
  forks_count: number
  ai_specs?: AISpecs
  first_seen_at?: string
  last_seen_at?: string
  total_appearances: number
  peak_rank: number
  daily_appearances: number
  weekly_appearances: number
  monthly_appearances: number
  trending_power_score: number
  all_time_rank: number
  trending_days?: number
  stars_today?: number
  latest_period?: 'daily' | 'weekly' | 'monthly'
}

export type TimeFilter = 'all' | 'daily' | 'weekly' | 'monthly'
export type SortOption = 'rank' | 'power_score' | 'growth_velocity' | 'stars' | 'readiness' | 'peak' | 'trending_days'
