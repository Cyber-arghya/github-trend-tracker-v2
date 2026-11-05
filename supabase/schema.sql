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

-- 5. All-Time Leaderboard Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_all_time_leaderboard AS
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
    COUNT(s.id) AS total_appearances,
    COALESCE(MIN(s.rank), 99) AS peak_rank,
    COUNT(CASE WHEN s.period = 'daily' THEN 1 END) AS daily_appearances,
    COUNT(CASE WHEN s.period = 'weekly' THEN 1 END) AS weekly_appearances,
    COUNT(CASE WHEN s.period = 'monthly' THEN 1 END) AS monthly_appearances,
    ROUND(
        (
            COALESCE(
                SUM(
                    (26 - LEAST(s.rank, 25)) *
                    CASE s.period
                        WHEN 'daily' THEN 1.0
                        WHEN 'weekly' THEN 2.5
                        WHEN 'monthly' THEN 5.0
                        ELSE 1.0
                    END *
                    EXP(-0.015 * EXTRACT(EPOCH FROM (NOW() - s.recorded_at)) / 86400.0)
                ),
                0
            ) + (0.5 * LOG(GREATEST(r.stars_count, 1)))
        )::numeric,
        2
    )::double precision AS trending_power_score,
    DENSE_RANK() OVER (
        ORDER BY (
            COALESCE(
                SUM(
                    (26 - LEAST(s.rank, 25)) *
                    CASE s.period
                        WHEN 'daily' THEN 1.0
                        WHEN 'weekly' THEN 2.5
                        WHEN 'monthly' THEN 5.0
                        ELSE 1.0
                    END *
                    EXP(-0.015 * EXTRACT(EPOCH FROM (NOW() - s.recorded_at)) / 86400.0)
                ),
                0
            ) + (0.5 * LOG(GREATEST(r.stars_count, 1)))
        ) DESC
    ) AS all_time_rank
FROM public.repositories r
LEFT JOIN public.trending_snapshots s ON r.id = s.repo_id
GROUP BY r.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_leaderboard_repo_id ON public.mv_all_time_leaderboard(repo_id);
CREATE INDEX IF NOT EXISTS idx_mv_leaderboard_rank ON public.mv_all_time_leaderboard(all_time_rank ASC);

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

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read repositories" ON public.repositories;
CREATE POLICY "Allow public read repositories" ON public.repositories FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow public insert/update repositories" ON public.repositories;
CREATE POLICY "Allow public insert/update repositories" ON public.repositories FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.trending_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read snapshots" ON public.trending_snapshots;
CREATE POLICY "Allow public read snapshots" ON public.trending_snapshots FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow public insert/update snapshots" ON public.trending_snapshots;
CREATE POLICY "Allow public insert/update snapshots" ON public.trending_snapshots FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read storage" ON storage.objects;
CREATE POLICY "Allow public read storage" ON storage.objects FOR SELECT TO public USING (bucket_id = 'readmes');
DROP POLICY IF EXISTS "Allow public insert storage" ON storage.objects;
CREATE POLICY "Allow public insert storage" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'readmes');
DROP POLICY IF EXISTS "Allow public update storage" ON storage.objects;
CREATE POLICY "Allow public update storage" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'readmes');
