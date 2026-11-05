"""
GitHub Trend Tracker V2 - Master Orchestrator Pipeline.
Scrapes trending repos, uploads READMEs to Supabase Storage, runs AI analysis, and saves snapshots.
"""

import argparse
import asyncio
import logging
import sys
from typing import List, Set
from dotenv import load_dotenv

from scraper.collector import ScrapedRepo, TrendingCollector
from scraper.storage import StorageManager
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
    enable_storage: bool = True,
    dry_run: bool = False
) -> None:
    """Main execution flow for Tracker V2."""
    logger.info("Starting GitHub Trend Tracker V2 Pipeline...")
    logger.info("Periods to ingest: %s | AI Enabled: %s | Storage Enabled: %s", periods, enable_ai, enable_storage)

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
            logger.info("Sample: [%s #%d] %s (%d stars, +%d stars)", r.period, r.rank, r.repo_name, r.stars_count, r.stars_today)
        return

    # Initialize Managers
    try:
        supabase = get_supabase_client()
        db = DatabaseManager(supabase)
        storage = StorageManager(supabase) if enable_storage else None
        intelligence = IntelligenceEngine() if enable_ai else None
    except Exception as init_err:
        logger.error("Failed to initialize database clients: %s", init_err)
        return

    processed_repos: Set[str] = set()

    for item in all_scraped:
        repo_name = item.repo_name
        readme_url = None
        ai_specs = None

        # Check if repo was already processed in this batch
        if repo_name not in processed_repos:
            # Step A: Fetch & Upload README to Supabase Storage
            if storage:
                try:
                    readme_url = await storage.get_or_upload_readme(item.owner, item.name)
                except Exception as s_err:
                    logger.warning("Storage upload failed for %s: %s", repo_name, s_err)

            # Step B: AI Structured Intelligence Analysis
            if intelligence:
                try:
                    # Fetch short snippet for AI context
                    readme_snippet = await StorageManager.fetch_raw_readme(item.owner, item.name)
                    analysis = intelligence.analyze_repository(
                        repo_name=item.repo_name,
                        description=item.description,
                        readme_snippet=readme_snippet
                    )
                    ai_specs = analysis.model_dump()
                except Exception as ai_err:
                    logger.warning("AI analysis failed for %s: %s", repo_name, ai_err)

            # Step C: Upsert into 'repositories' table
            repo_id = db.upsert_repository(item, readme_storage_url=readme_url, ai_specs=ai_specs)
            processed_repos.add(repo_name)
        else:
            # Query existing id for snapshot
            repo_id = db.upsert_repository(item)

        # Step D: Insert Snapshot Row into 'trending_snapshots' table
        if repo_id:
            db.insert_snapshot(repo_id, item)

    # Step E: Refresh Materialized View
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
    parser.add_argument("--no-ai", action="store_true", help="Disable Gemini AI intelligence extraction")
    parser.add_argument("--no-storage", action="store_true", help="Disable Supabase Storage README uploads")
    parser.add_argument("--dry-run", action="store_true", help="Simulate scraping without writing to database")

    args = parser.parse_args()
    periods = ["daily", "weekly", "monthly"] if args.period == "all" else [args.period]

    asyncio.run(
        run_pipeline(
            periods=periods,
            enable_ai=not args.no_ai,
            enable_storage=not args.no_storage,
            dry_run=args.dry_run
        )
    )


if __name__ == "__main__":
    main()

