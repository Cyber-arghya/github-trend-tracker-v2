"""
AI Repository Analyzer using Gemini 2.5 Flash & Pydantic Structured Output.
Extracts architectural blueprints, tech stack tags, production scores, and license risk.
"""

import json
import logging
import os
from typing import List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class RepoIntelligence(BaseModel):
    key_value_proposition: str = Field(
        ..., description="One concise sentence explaining what this project solves and why it is valuable."
    )
    architecture_type: str = Field(
        ..., description="Category: CLI Tool, AI/ML Framework, Full-Stack App, Library/SDK, Infrastructure/DevOps, Mobile App, Database/Engine."
    )
    tech_stack: List[str] = Field(
        default_factory=list, description="Top 3 to 6 key technologies, libraries, or frameworks used."
    )
    license_risk: str = Field(
        ..., description="License safety rating: Low (MIT/Apache 2.0/BSD), Medium (GPL/LGPL/MPL), High/Proprietary/Unknown."
    )
    production_score: int = Field(
        ..., ge=1, le=100, description="Readiness score from 1-100 evaluating code maturity, documentation, testing, and production viability."
    )
    quick_start_command: Optional[str] = Field(
        None, description="Fastest CLI command to run or install the project (e.g., 'docker run ...', 'npm install', 'uv add ...')."
    )


class IntelligenceEngine:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    def analyze_repository(
        self,
        repo_name: str,
        description: Optional[str],
        readme_snippet: Optional[str]
    ) -> RepoIntelligence:
        """
        Analyzes repository description and truncated README to extract structured intelligence.
        Falls back gracefully if API key is not present or an error occurs.
        """
        if not self.api_key or self.api_key.strip() in ("", "your-gemini-api-key"):
            return self._heuristic_fallback(repo_name, description)

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)
            prompt = (
                f"You are a Principal Software Architect evaluating an open-source GitHub repository.\n"
                f"Repository: {repo_name}\n"
                f"Description: {description or 'N/A'}\n\n"
                f"README Context (excerpt):\n"
                f"{readme_snippet[:4000] if readme_snippet else 'No README provided.'}\n\n"
                f"Produce an objective, structured technical evaluation."
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=RepoIntelligence,
                    temperature=0.2,
                ),
            )

            parsed = json.loads(response.text)
            return RepoIntelligence(**parsed)
        except Exception as e:
            logger.warning("Gemini AI analysis failed for %s, using fallback heuristics: %s", repo_name, e)
            return self._heuristic_fallback(repo_name, description)

    @staticmethod
    def _heuristic_fallback(repo_name: str, description: Optional[str]) -> RepoIntelligence:
        """Rule-based fallback when AI is unavailable or offline."""
        desc = (description or "").lower()
        
        # Determine architecture
        if any(w in desc for w in ["cli", "command line", "terminal", "tool"]):
            arch = "CLI Tool"
        elif any(w in desc for w in ["llm", "ai", "gpt", "model", "agent", "deep learning", "machine learning"]):
            arch = "AI/ML Framework"
        elif any(w in desc for w in ["framework", "library", "sdk", "api client", "wrapper"]):
            arch = "Library/SDK"
        elif any(w in desc for w in ["docker", "k8s", "kubernetes", "cloud", "infra", "deploy"]):
            arch = "Infrastructure/DevOps"
        else:
            arch = "Full-Stack App"

        # Determine tech stack hints
        stack = []
        for tech in ["python", "rust", "typescript", "javascript", "go", "react", "next.js", "vue", "pytorch"]:
            if tech in desc:
                stack.append(tech.capitalize())
        if not stack:
            stack = ["Open Source"]

        return RepoIntelligence(
            key_value_proposition=description or f"Open-source repository {repo_name} trending on GitHub.",
            architecture_type=arch,
            tech_stack=stack,
            license_risk="Low (Standard OSS)",
            production_score=75,
            quick_start_command=f"git clone https://github.com/{repo_name}.git",
        )

