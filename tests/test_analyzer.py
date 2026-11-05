"""Unit tests for IntelligenceEngine."""

from scraper.analyzer import IntelligenceEngine, RepoIntelligence


def test_heuristic_fallback_cli():
    engine = IntelligenceEngine(api_key=None)
    analysis = engine.analyze_repository(
        repo_name="astral-sh/uv",
        description="An extremely fast Python package and project manager written in Rust, featuring a robust CLI interface.",
        readme_snippet=None
    )

    assert isinstance(analysis, RepoIntelligence)
    assert analysis.architecture_type == "CLI Tool"
    assert "Python" in analysis.tech_stack or "Rust" in analysis.tech_stack
    assert analysis.production_score >= 70
    assert "uv" in analysis.quick_start_command


def test_heuristic_fallback_aiml():
    engine = IntelligenceEngine(api_key=None)
    analysis = engine.analyze_repository(
        repo_name="vllm-project/vllm",
        description="A high-throughput and memory-efficient LLM serving and inference engine.",
        readme_snippet=None
    )

    assert isinstance(analysis, RepoIntelligence)
    assert analysis.architecture_type == "AI/ML Framework"
    assert analysis.license_risk.startswith("Low")

