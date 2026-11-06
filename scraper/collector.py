"""
High-Performance Async GitHub Trending Collector for Tracker V2.
Uses httpx and Parsel (lxml-based CSS selectors) to extract trending repositories.
"""

import logging
import re
from typing import List, Optional
import httpx
from parsel import Selector
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ScrapedRepo(BaseModel):
    rank: int
    period: str
    owner: str
    name: str
    repo_name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars_count: int = 0
    forks_count: int = 0
    stars_today: int = 0
    raw_stars_delta: int = 0
    daily_velocity: int = 0


class TrendingCollector:
    BASE_URL = "https://github.com/trending"

    def __init__(self, client: Optional[httpx.AsyncClient] = None):
        self._client = client

    @staticmethod
    def _parse_int(value_str: Optional[str]) -> int:
        """Helper to parse formatted number strings like '1,234' or '45k' into int."""
        if not value_str:
            return 0
        cleaned = value_str.strip().replace(",", "")
        # Handle 1.2k notation if present
        if cleaned.lower().endswith("k"):
            try:
                return int(float(cleaned[:-1]) * 1000)
            except ValueError:
                return 0
        try:
            return int(cleaned)
        except ValueError:
            return 0

    @staticmethod
    def _parse_stars_today(text: Optional[str]) -> int:
        """Extracts numerical star delta from text like '140 stars today' or '500 stars this week'."""
        if not text:
            return 0
        match = re.search(r"([\d,]+)\s+stars", text.replace("\n", " "))
        if match:
            return TrendingCollector._parse_int(match.group(1))
        return 0

    @staticmethod
    def normalize_to_daily_velocity(stars_delta: int, period: str) -> int:
        """
        Normalizes rolling period delta into a true 24-hour daily velocity rate.
        - daily: rolling 24 hours -> delta
        - weekly: rolling 7 days -> round(delta / 7.0)
        - monthly: rolling 30 days -> round(delta / 30.0)
        """
        if stars_delta <= 0:
            return 0
        if period == "weekly":
            return max(1, int(round(stars_delta / 7.0)))
        elif period == "monthly":
            return max(1, int(round(stars_delta / 30.0)))
        return stars_delta

    async def fetch_trending(
        self,
        period: str = "daily",
        language: Optional[str] = None
    ) -> List[ScrapedRepo]:
        """
        Scrapes GitHub trending page for the given period ('daily', 'weekly', 'monthly')
        and optional language.
        """
        params = {"since": period}
        url = f"{self.BASE_URL}/{language}" if language else self.BASE_URL
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

        should_close = False
        client = self._client
        if client is None:
            client = httpx.AsyncClient(timeout=15.0, follow_redirects=True)
            should_close = True

        try:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            return self.parse_html(response.text, period=period)
        except Exception as e:
            logger.error("Failed to fetch trending repos for %s (lang=%s): %s", period, language, e)
            return []
        finally:
            if should_close:
                await client.aclose()

    def parse_html(self, html_content: str, period: str = "daily") -> List[ScrapedRepo]:
        """
        Parses raw HTML from GitHub Trending into structured ScrapedRepo objects.
        """
        selector = Selector(text=html_content)
        articles = selector.css("article.Box-row")
        repos: List[ScrapedRepo] = []

        for idx, article in enumerate(articles, start=1):
            # Extract repository name and owner
            title_el = article.css("h2 a::attr(href)").get()
            if not title_el:
                continue
            repo_path = title_el.strip().strip("/")
            parts = repo_path.split("/")
            if len(parts) < 2:
                continue
            owner, name = parts[0], parts[1]
            repo_name = f"{owner}/{name}"

            # Extract description
            desc_el = article.css("p::text").get()
            description = desc_el.strip() if desc_el else None

            # Extract language
            lang_el = article.css("span[itemprop='programmingLanguage']::text").get()
            language = lang_el.strip() if lang_el else None

            # Extract stars and forks using specific href endings
            stars_texts = article.css("a[href$='/stargazers']::text").getall()
            stars_str = "".join(stars_texts).strip()
            stars_count = self._parse_int(stars_str)

            forks_texts = article.css("a[href$='/forks']::text").getall()
            forks_str = "".join(forks_texts).strip()
            forks_count = self._parse_int(forks_str)

            # Extract stars today / this period and normalize to true 24h daily velocity
            stars_today_texts = article.css("span.float-sm-right::text").getall()
            stars_today_str = "".join(stars_today_texts).strip()
            raw_stars_delta = self._parse_stars_today(stars_today_str)
            daily_velocity = self.normalize_to_daily_velocity(raw_stars_delta, period=period)

            repos.append(
                ScrapedRepo(
                    rank=idx,
                    period=period,
                    owner=owner,
                    name=name,
                    repo_name=repo_name,
                    description=description,
                    language=language,
                    stars_count=stars_count,
                    forks_count=forks_count,
                    stars_today=daily_velocity,  # Backward compatible: holds normalized 24h rate
                    raw_stars_delta=raw_stars_delta,
                    daily_velocity=daily_velocity,
                )
            )

        return repos
