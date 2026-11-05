"""
Database Client and Repository Store for Tracker V2.
Manages relational persistence in Supabase PostgreSQL tables:
- 'repositories'
- 'trending_snapshots'
- Materialized View Refresh
"""

import logging
import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from supabase import Client, create_client

from scraper.collector import ScrapedRepo

load_dotenv()
logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """Initializes and returns Supabase client."""
    url = os.getenv("SUPABASE_URL")
    # Prefer service_role key for backend writes, fallback to anon key
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and a Supabase key must be configured in environment variables.")
    return create_client(url, key)


class DatabaseManager:
    def __init__(self, client: Optional[Client] = None):
        self.client = client or get_supabase_client()

    def upsert_repository(
        self,
        repo: ScrapedRepo,
        readme_storage_url: Optional[str] = None,
        ai_specs: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Upserts a repository record in 'repositories' table.
        Returns the repository UUID.
        """
        repo_data: Dict[str, Any] = {
            "repo_name": repo.repo_name,
            "owner": repo.owner,
            "name": repo.name,
            "description": repo.description,
            "language": repo.language,
            "stars_count": repo.stars_count,
            "forks_count": repo.forks_count,
            "last_seen_at": "now()",
            "updated_at": "now()"
        }
        if readme_storage_url:
            repo_data["readme_storage_url"] = readme_storage_url
        if ai_specs:
            repo_data["ai_specs"] = ai_specs

        try:
            # Query existing repo by repo_name
            existing = self.client.table("repositories").select("id").eq("repo_name", repo.repo_name).execute()
            if existing.data and len(existing.data) > 0:
                repo_id = existing.data[0]["id"]
                self.client.table("repositories").update(repo_data).eq("id", repo_id).execute()
                return repo_id
            else:
                # Insert new
                inserted = self.client.table("repositories").insert(repo_data).execute()
                if inserted.data and len(inserted.data) > 0:
                    return inserted.data[0]["id"]
        except Exception as e:
            logger.error("Error upserting repository %s: %s", repo.repo_name, e)
        return None

    def insert_snapshot(self, repo_id: str, repo: ScrapedRepo) -> bool:
        """
        Inserts a trending snapshot row for the given repository.
        """
        snapshot_data = {
            "repo_id": repo_id,
            "rank": repo.rank,
            "period": repo.period,
            "stars_today": repo.stars_today,
            "recorded_at": "now()"
        }
        try:
            self.client.table("trending_snapshots").insert(snapshot_data).execute()
            return True
        except Exception as e:
            logger.error("Error inserting snapshot for repo_id %s: %s", repo_id, e)
            return False

    def refresh_leaderboard(self) -> bool:
        """
        Calls the PostgreSQL stored procedure to refresh mv_all_time_leaderboard.
        """
        try:
            self.client.rpc("refresh_all_time_leaderboard", {}).execute()
            logger.info("Materialized view 'mv_all_time_leaderboard' refreshed successfully.")
            return True
        except Exception as e:
            logger.warning("Could not refresh materialized view via RPC (may require table creation): %s", e)
            return False

