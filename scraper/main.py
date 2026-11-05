"""
GitHub Trend Tracker V2 - High-Speed Autonomous Metadata Pipeline.
Scrapes trending repos, runs Multi-Tier AI Analysis (NVIDIA Nemotron / Gemini),
and persists historical trajectory without downloading bloated README files.
"""

import argparse
import asyncio
import logging
import sys
from typing import List, Set
from dotenv import load_dotenv

from scraper.collector import ScrapedRepo, TrendingCollector
from scraper.analyzer import IntelligenceEngine
from scraper.db import DatabaseManager, get_supabase_client

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("tracker_v2")
load_dotenv()


async def run_pipeline(
    periods: List[str],
    enable_ai: bool = True,
    dry_run: bool = False
) -> None:
    """Main execution flow for Tracker V2 with zero file downloads."""
    logger.info("Starting GitHub Trend Tracker V2 Pipeline...")
    logger.info("Periods to ingest: %s | AI Enabled: %s | Zero Storage Mode: Active", periods, enable_ai)

    collector = TrendingCollector()
    all_scraped: List[ScrapedRepo] = []

    # 1. Scrape all requested periods
    for period in periods:
        logger.info("Scraping period: %s ...", period)
        repos = await collector.fetch_trending(period=period)
        logger.info("Collected %d repositories for period %s", len(repos), period)
        all_scraped.extend(repos)

    if not all_scraped:
        logger.warning("No repositories were scraped. Exiting.")
        return

    if dry_run:
        logger.info("Dry-run mode active. Processed %d records without database writes.", len(all_scraped))
        for r in all_scraped[:5]:
            logger.info("Sample: [%s #%d] %s (%s, %d stars, +%d stars)", r.period, r.rank, r.repo_name, r.language, r.stars_count, r.stars_today)
        return

    # Initialize Database & AI Managers
    try:
        supabase = get_supabase_client()
        db = DatabaseManager(supabase)
        intelligence = IntelligenceEngine() if enable_ai else None
    except Exception as init_err:
        logger.error("Failed to initialize database clients: %s", init_err)
        return

    processed_repos: Set[str] = set()

    for item in all_scraped:
        repo_name = item.repo_name
        ai_specs = None

        # Check if repo was already processed in this batch
        if repo_name not in processed_repos:
            # AI Structured Intelligence Analysis (NVIDIA Primary -> Gemini Fallback)
            if intelligence:
                try:
                    analysis = intelligence.analyze_repository(
                        repo_name=item.repo_name,
                        description=item.description,
                        language=item.language,
                        stars_today=item.stars_today,
                        stars_count=item.stars_count,
                    )
                    ai_specs = analysis.model_dump()
                except Exception as ai_err:
                    logger.warning("AI analysis failed for %s: %s", repo_name, ai_err)

            # Upsert into 'repositories' table
            repo_id = db.upsert_repository(item, ai_specs=ai_specs)
            processed_repos.add(repo_name)
        else:
            # Query/update existing id for snapshot
            repo_id = db.upsert_repository(item)

        # Insert Snapshot Row into 'trending_snapshots' table
        if repo_id:
            db.insert_snapshot(repo_id, item)

    # Refresh Materialized View
    db.refresh_leaderboard()
    logger.info("Pipeline completed successfully! Processed %d snapshots across %d unique repositories.", len(all_scraped), len(processed_repos))


def main():
    parser = argparse.ArgumentParser(description="GitHub Trend Tracker V2 Scraper")
    parser.add_argument(
        "--period",
        choices=["daily", "weekly", "monthly", "all"],
        default="all",
        help="Trending period to fetch (default: all)"
    )
    parser.add_argument("--no-ai", action="store_true", help="Disable AI intelligence extraction")
    parser.add_argument("--dry-run", action="store_true", help="Simulate scraping without writing to database")

    args = parser.parse_args()
    periods = ["daily", "weekly", "monthly"] if args.period == "all" else [args.period]

    asyncio.run(
        run_pipeline(
            periods=periods,
            enable_ai=not args.no_ai,
            dry_run=args.dry_run
        )
    )


if __name__ == "__main__":
    main()
