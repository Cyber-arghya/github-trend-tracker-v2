-- ==============================================================================
-- GitHub Trend Tracker V2 - Database Schema & Supabase Storage Initialization
-- Project Reference: gnpauzccwwndavoqddzv
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Master Repositories Table
CREATE TABLE IF NOT EXISTS public.repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_name TEXT UNIQUE NOT NULL,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    language TEXT,
    stars_count INTEGER NOT NULL DEFAULT 0,
    forks_count INTEGER NOT NULL DEFAULT 0,
    trending_power_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    readme_storage_url TEXT,
    ai_specs JSONB,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Historical Trending Snapshots Table (Relational Foreign Key)
CREATE TABLE IF NOT EXISTS public.trending_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
    stars_today INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. High-Performance Performance Indexes
CREATE INDEX IF NOT EXISTS idx_repos_repo_name ON public.repositories(repo_name);
CREATE INDEX IF NOT EXISTS idx_repos_power_score ON public.repositories(trending_power_score DESC);
CREATE INDEX IF NOT EXISTS idx_repos_language ON public.repositories(language);
CREATE INDEX IF NOT EXISTS idx_snapshots_repo_period ON public.trending_snapshots(repo_id, period, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_recorded_at ON public.trending_snapshots(recorded_at DESC);

-- 5. All-Time Leaderboard Materialized View (Rolling 7d/30d Windows, Active Streaks & Momentum)
DROP MATERIALIZED VIEW IF EXISTS public.mv_all_time_leaderboard CASCADE;

CREATE MATERIALIZED VIEW public.mv_all_time_leaderboard AS
WITH latest_snapshot AS (
    -- Latest 24h normalized velocity per repo
    SELECT DISTINCT ON (repo_id)
        repo_id,
        stars_today AS latest_velocity,
        period AS latest_period
    FROM public.trending_snapshots
    ORDER BY repo_id, recorded_at DESC
),
daily_runs AS (
    -- Distinct calendar dates per repository in the last 30 days
    SELECT DISTINCT
        repo_id,
        recorded_at::date AS dt
    FROM public.trending_snapshots
    WHERE recorded_at >= CURRENT_DATE - 30
),
grouped_streaks AS (
    -- Gaps & Islands: consecutive dates have identical group key
    SELECT
        repo_id,
        dt,
        dt - (ROW_NUMBER() OVER (PARTITION BY repo_id ORDER BY dt) * INTERVAL '1 day') AS grp
    FROM daily_runs
),
streak_stats AS (
    SELECT
        repo_id,
        grp,
        COUNT(*) AS streak_len,
        MAX(dt) AS end_date
    FROM grouped_streaks
    GROUP BY repo_id, grp
),
streak_summary AS (
    SELECT
        repo_id,
        COALESCE(MAX(streak_len), 0) AS max_streak_30d,
        COALESCE(
            MAX(streak_len) FILTER (WHERE end_date >= CURRENT_DATE - 1),
            0
        ) AS current_streak
    FROM streak_stats
    GROUP BY repo_id
),
window_counts AS (
    SELECT
        repo_id,
        COUNT(DISTINCT dt) AS days_30d,
        COUNT(DISTINCT dt) FILTER (WHERE dt >= CURRENT_DATE - 7) AS days_7d
    FROM daily_runs
    GROUP BY repo_id
),
daily_presence_all AS (
    -- All-time calendar dates per repo
    SELECT
        repo_id,
        recorded_at::date AS snapshot_date,
        MIN(rank) AS best_rank_of_day
    FROM public.trending_snapshots
    GROUP BY repo_id, recorded_at::date
),
all_time_summary AS (
    SELECT
        repo_id,
        COUNT(DISTINCT snapshot_date) AS trending_days
    FROM daily_presence_all
    GROUP BY repo_id
),
snapshot_counts AS (
    SELECT
        repo_id,
        COUNT(id) AS total_appearances,
        COALESCE(MIN(rank), 99) AS peak_rank,
        COUNT(CASE WHEN period = 'daily' THEN 1 END) AS daily_appearances,
        COUNT(CASE WHEN period = 'weekly' THEN 1 END) AS weekly_appearances,
        COUNT(CASE WHEN period = 'monthly' THEN 1 END) AS monthly_appearances
    FROM public.trending_snapshots
    GROUP BY repo_id
),
aggregated_metrics AS (
    SELECT
        r.id AS repo_id,
        r.repo_name,
        r.owner,
        r.name,
        r.description,
        r.language,
        r.stars_count,
        r.forks_count,
        r.readme_storage_url,
        r.ai_specs,
        r.first_seen_at,
        r.last_seen_at,
        COALESCE(sc.total_appearances, 0) AS total_appearances,
        COALESCE(sc.peak_rank, 99) AS peak_rank,
        COALESCE(sc.daily_appearances, 0) AS daily_appearances,
        COALESCE(sc.weekly_appearances, 0) AS weekly_appearances,
        COALESCE(sc.monthly_appearances, 0) AS monthly_appearances,
        COALESCE(ats.trending_days, 0) AS trending_days,
        COALESCE(wc.days_7d, 0) AS days_7d,
        COALESCE(wc.days_30d, 0) AS days_30d,
        COALESCE(ss.current_streak, 0) AS current_streak,
        COALESCE(ss.max_streak_30d, 0) AS max_streak_30d,
        COALESCE(ls.latest_velocity, 0) AS latest_velocity,
        COALESCE(ls.latest_period, 'daily') AS latest_period,
        -- Normalized Velocity V_tilde: [0.0, 1.0] saturated at 2,000 stars/day
        LEAST(1.0, LN(1.0 + GREATEST(COALESCE(ls.latest_velocity, 0), 0)) / LN(2001.0)) AS normalized_velocity
    FROM public.repositories r
    LEFT JOIN latest_snapshot ls ON r.id = ls.repo_id
    LEFT JOIN window_counts wc ON r.id = wc.repo_id
    LEFT JOIN streak_summary ss ON r.id = ss.repo_id
    LEFT JOIN all_time_summary ats ON r.id = ats.repo_id
    LEFT JOIN snapshot_counts sc ON r.id = sc.repo_id
)
SELECT
    m.repo_id,
    m.repo_name,
    m.owner,
    m.name,
    m.description,
    m.language,
    m.stars_count,
    m.forks_count,
    m.readme_storage_url,
    m.ai_specs,
    m.first_seen_at,
    m.last_seen_at,
    m.total_appearances,
    m.peak_rank,
    m.daily_appearances,
    m.weekly_appearances,
    m.monthly_appearances,
    m.trending_days,
    m.days_7d,
    m.days_30d,
    m.current_streak,
    m.max_streak_30d,
    m.latest_velocity AS stars_today,
    m.latest_period,
    -- Trending Power Score: Breakout Momentum + 7d Hotness + 30d Endurance + Streak Bonus + Credibility Base
    ROUND(
        (
            -- 1. Breakout Velocity Momentum (0 to 100 pts)
            (100.0 * m.normalized_velocity)
            -- 2. 7-Day Hotness (0 to 40 pts)
            + (40.0 * (m.days_7d::double precision / 7.0))
            -- 3. 30-Day Endurance (0 to 25 pts)
            + (25.0 * (m.days_30d::double precision / 30.0))
            -- 4. Active Streak Bonus (0 to 15 pts)
            + (15.0 * (LEAST(m.current_streak, 7)::double precision / 7.0))
            -- 5. Baseline Stars Credibility (Log scale)
            + (10.0 * LOG(GREATEST(m.stars_count, 1) + 1))
        )::numeric,
        2
    )::double precision AS trending_power_score,
    DENSE_RANK() OVER (
        ORDER BY (
            (100.0 * m.normalized_velocity)
            + (40.0 * (m.days_7d::double precision / 7.0))
            + (25.0 * (m.days_30d::double precision / 30.0))
            + (15.0 * (LEAST(m.current_streak, 7)::double precision / 7.0))
            + (10.0 * LOG(GREATEST(m.stars_count, 1) + 1))
        ) DESC
    ) AS all_time_rank
FROM aggregated_metrics m;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_leaderboard_repo_id ON public.mv_all_time_leaderboard(repo_id);
CREATE INDEX IF NOT EXISTS idx_mv_leaderboard_rank ON public.mv_all_time_leaderboard(all_time_rank ASC);
CREATE INDEX IF NOT EXISTS idx_mv_leaderboard_power ON public.mv_all_time_leaderboard(trending_power_score DESC);
CREATE INDEX IF NOT EXISTS idx_mv_leaderboard_days_7d ON public.mv_all_time_leaderboard(days_7d DESC);

-- 6. Helper Function to Refresh Leaderboard
CREATE OR REPLACE FUNCTION public.refresh_all_time_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_all_time_leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Supabase Storage Bucket Initialization ('readmes')
INSERT INTO storage.buckets (id, name, public)
VALUES ('readmes', 'readmes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 8. Row Level Security (RLS) Policies - STRICT LEAST PRIVILEGE
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read repositories" ON public.repositories;
DROP POLICY IF EXISTS "Allow public insert/update repositories" ON public.repositories;
CREATE POLICY "Allow public read repositories" ON public.repositories FOR SELECT TO public USING (true);

ALTER TABLE public.trending_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read snapshots" ON public.trending_snapshots;
DROP POLICY IF EXISTS "Allow public insert/update snapshots" ON public.trending_snapshots;
CREATE POLICY "Allow public read snapshots" ON public.trending_snapshots FOR SELECT TO public USING (true);

-- Storage bucket access policies
DROP POLICY IF EXISTS "Allow public read storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update storage" ON storage.objects;
CREATE POLICY "Allow public read storage" ON storage.objects FOR SELECT TO public USING (bucket_id = 'readmes');


