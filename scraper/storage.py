"""
Supabase Storage Handler for GitHub Trend Tracker V2.
Stores raw repository README markdown files in Supabase Storage bucket 'readmes'.
"""

import logging
from typing import Optional
import httpx
from supabase import Client

logger = logging.getLogger(__name__)

BUCKET_NAME = "readmes"


class StorageManager:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def get_or_upload_readme(
        self,
        owner: str,
        repo: str,
        github_token: Optional[str] = None,
        force_refresh: bool = False
    ) -> Optional[str]:
        """
        Fetches the repository README and stores it in Supabase Storage.
        Returns the public URL or storage path.
        """
        file_path = f"{owner}_{repo}.md"

        # 1. Fetch README content from GitHub
        readme_content = await self.fetch_raw_readme(owner, repo, github_token)
        if not readme_content:
            logger.warning("No README found for %s/%s", owner, repo)
            return None

        # 2. Upload to Supabase Storage
        try:
            # Upload using binary/utf-8 bytes
            data_bytes = readme_content.encode("utf-8")
            self.supabase.storage.from_(BUCKET_NAME).upload(
                path=file_path,
                file=data_bytes,
                file_options={"content-type": "text/markdown; charset=utf-8", "upsert": "true"}
            )
            # Retrieve public URL
            public_url = self.supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
            logger.info("Successfully uploaded README for %s/%s to Storage", owner, repo)
            return public_url
        except Exception as e:
            logger.error("Failed to upload README for %s/%s to Supabase Storage: %s", owner, repo, e)
            return None

    @staticmethod
    async def fetch_raw_readme(
        owner: str,
        repo: str,
        github_token: Optional[str] = None
    ) -> Optional[str]:
        """
        Attempts to fetch raw README across HEAD, main, and master branches.
        """
        branches = ["HEAD", "main", "master"]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        if github_token:
            headers["Authorization"] = f"token {github_token}"

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            for branch in branches:
                for filename in ["README.md", "readme.md", "Readme.md"]:
                    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{filename}"
                    try:
                        resp = await client.get(raw_url, headers=headers)
                        if resp.status_code == 200 and resp.text.strip():
                            return resp.text
                    except Exception as err:
                        logger.debug("Failed branch %s attempt for %s/%s: %s", branch, owner, repo, err)
                        continue

            # Fallback to GitHub API README endpoint if token is present
            if github_token:
                try:
                    api_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
                    api_headers = {**headers, "Accept": "application/vnd.github.raw+json"}
                    resp = await client.get(api_url, headers=api_headers)
                    if resp.status_code == 200 and resp.text.strip():
                        return resp.text
                except Exception as api_err:
                    logger.debug("GitHub API fallback failed for %s/%s: %s", owner, repo, api_err)

        return None
