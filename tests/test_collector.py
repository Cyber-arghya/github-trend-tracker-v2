"""Unit tests for TrendingCollector."""

import pytest
from scraper.collector import TrendingCollector, ScrapedRepo

SAMPLE_HTML = """
<ol class="repo-list">
  <article class="Box-row">
    <h2 class="h3 lh-condensed">
      <a href="/anthropics/claude-code">
        anthropics / claude-code
      </a>
    </h2>
    <p class="col-9 color-fg-muted my-1 pr-4">
      An agentic coding tool that lives in your terminal.
    </p>
    <div class="f6 color-fg-muted mt-2">
      <span class="d-inline-block mr-3">
        <span itemprop="programmingLanguage">TypeScript</span>
      </span>
      <a class="Link--muted d-inline-block mr-3" href="/anthropics/claude-code/stargazers">
        12,450
      </a>
      <a class="Link--muted d-inline-block mr-3" href="/anthropics/claude-code/forks">
        850
      </a>
      <span class="d-inline-block float-sm-right">
        1,200 stars today
      </span>
    </div>
  </article>
</ol>
"""


def test_parse_html():
    collector = TrendingCollector()
    repos = collector.parse_html(SAMPLE_HTML, period="daily")

    assert len(repos) == 1
    repo = repos[0]
    assert repo.rank == 1
    assert repo.period == "daily"
    assert repo.owner == "anthropics"
    assert repo.name == "claude-code"
    assert repo.repo_name == "anthropics/claude-code"
    assert "agentic coding tool" in repo.description
    assert repo.language == "TypeScript"
    assert repo.stars_count == 12450
    assert repo.forks_count == 850
    assert repo.stars_today == 1200


def test_parse_int_variations():
    assert TrendingCollector._parse_int("1,234") == 1234
    assert TrendingCollector._parse_int("500") == 500
    assert TrendingCollector._parse_int("12.5k") == 12500
    assert TrendingCollector._parse_int(None) == 0
    assert TrendingCollector._parse_int("invalid") == 0


def test_parse_stars_today():
    assert TrendingCollector._parse_stars_today("140 stars today") == 140
    assert TrendingCollector._parse_stars_today("2,500 stars this week") == 2500
    assert TrendingCollector._parse_stars_today(None) == 0
