"""
Multi-Tier AI Repository Intelligence Analyzer for Tracker V2.
Primary: NVIDIA Nemotron-3-Ultra-550B (NVIDIA API)
Fallback: Google Gemini 2.5 Flash
Heuristic Fallback: Rule-based keyword matching

Zero file downloads: operates strictly on high-density metadata from GitHub Trending.
"""

import json
import logging
import os
import re
from typing import List, Optional
import httpx
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
    def __init__(
        self,
        nvidia_api_key: Optional[str] = None,
        nvidia_base_url: Optional[str] = None,
        nvidia_model: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
    ):
        self.nvidia_api_key = nvidia_api_key or os.getenv("NVIDIA_API_KEY")
        self.nvidia_base_url = (nvidia_base_url or os.getenv("NVIDIA_BASE_URL") or "https://integrate.api.nvidia.com/v1").rstrip("/")
        self.nvidia_model = nvidia_model or os.getenv("NVIDIA_MODEL") or "nvidia/nemotron-3-ultra-550b-a55b"
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")

    def analyze_repository(
        self,
        repo_name: str,
        description: Optional[str],
        language: Optional[str] = None,
        stars_today: int = 0,
        stars_count: int = 0,
    ) -> RepoIntelligence:
        """
        Analyzes repository metadata without downloading any files.
        Primary: NVIDIA -> Fallback: Gemini -> Fallback: Heuristic.
        """
        # 1. Try Primary: NVIDIA API
        if self.nvidia_api_key and not self.nvidia_api_key.startswith("your-"):
            nvidia_result = self._call_nvidia(repo_name, description, language, stars_today, stars_count)
            if nvidia_result:
                return nvidia_result

        # 2. Try Fallback: Gemini API
        if self.gemini_api_key and not self.gemini_api_key.startswith("your-"):
            gemini_result = self._call_gemini(repo_name, description, language)
            if gemini_result:
                return gemini_result

        # 3. Final Fallback: Heuristic
        logger.info("Using heuristic fallback evaluation for %s", repo_name)
        return self._heuristic_fallback(repo_name, description, language)

    def _call_nvidia(
        self,
        repo_name: str,
        description: Optional[str],
        language: Optional[str],
        stars_today: int,
        stars_count: int
    ) -> Optional[RepoIntelligence]:
        """Calls NVIDIA API (nemotron-3-ultra-550b-a55b)."""
        prompt = (
            f"You are a Principal Software Architect evaluating a trending open-source repository on GitHub.\n"
            f"Repository: {repo_name}\n"
            f"Primary Language: {language or 'Unknown'}\n"
            f"Total Stars: {stars_count} | Velocity: +{stars_today} stars today\n"
            f"Description: {description or 'N/A'}\n\n"
            f"Task: Evaluate this repository. If the description is non-English (e.g. Chinese), translate its meaning into a concise English value proposition.\n"
            f"Output strictly valid JSON with no markdown wrapping and keys:\n"
            f'{{\n'
            f'  "key_value_proposition": "Clear 1-sentence explanation of what it solves",\n'
            f'  "architecture_type": "Category (CLI Tool, AI/ML Framework, Full-Stack App, Library/SDK, Infrastructure/DevOps, Database)",\n'
            f'  "tech_stack": ["Tag1", "Tag2", "Tag3"],\n'
            f'  "license_risk": "Low (MIT/Apache-2.0) or Medium or High",\n'
            f'  "production_score": 85,\n'
            f'  "quick_start_command": "e.g. git clone ... or npm install ..."\n'
            f'}}\n'
        )

        headers = {
            "Authorization": f"Bearer {self.nvidia_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.nvidia_model,
            "messages": [
                {"role": "system", "content": "You are an expert software analyst. Always output strictly valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 2048
        }

        try:
            with httpx.Client(timeout=25.0) as client:
                resp = client.post(f"{self.nvidia_base_url}/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    raw_text = resp.json()["choices"][0]["message"]["content"].strip()
                    # Clean potential markdown code fences
                    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                    raw_text = re.sub(r"\s*```$", "", raw_text)
                    parsed = json.loads(raw_text)

                    # Ensure production score is an integer between 1 and 100
                    score = parsed.get("production_score", 75)
                    if isinstance(score, (int, float)):
                        if score <= 10:  # In case model outputs 1-10
                            score = int(score * 10)
                        score = max(1, min(100, int(score)))
                        parsed["production_score"] = score

                    logger.info("Successfully analyzed %s with NVIDIA %s", repo_name, self.nvidia_model)
                    return RepoIntelligence(**parsed)
                else:
                    logger.warning("NVIDIA API returned HTTP %s for %s: %s", resp.status_code, repo_name, resp.text)
        except Exception as err:
            logger.warning("NVIDIA analysis error for %s: %s", repo_name, err)
        return None

    def _call_gemini(
        self,
        repo_name: str,
        description: Optional[str],
        language: Optional[str]
    ) -> Optional[RepoIntelligence]:
        """Calls Google Gemini 2.5 Flash as secondary fallback."""
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.gemini_api_key)
            prompt = (
                f"Analyze trending GitHub repository: {repo_name}\n"
                f"Language: {language or 'Unknown'}\n"
                f"Description: {description or 'N/A'}\n"
                f"Produce structured technical evaluation. If description is foreign, translate to English."
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
            logger.info("Successfully analyzed %s with Gemini fallback", repo_name)
            return RepoIntelligence(**parsed)
        except Exception as e:
            logger.warning("Gemini fallback analysis error for %s: %s", repo_name, e)
            return None

    @staticmethod
    def _heuristic_fallback(
        repo_name: str,
        description: Optional[str],
        language: Optional[str] = None
    ) -> RepoIntelligence:
        """Fast offline rule-based heuristic fallback."""
        desc = (description or "").lower()
        
        # Categorize
        if any(w in desc for w in ["cli", "command line", "terminal", "tool"]):
            arch = "CLI Tool"
        elif any(w in desc for w in ["llm", "ai", "gpt", "model", "agent", "deep learning", "machine learning", "ontology"]):
            arch = "AI/ML Framework"
        elif any(w in desc for w in ["framework", "library", "sdk", "api client", "wrapper"]):
            arch = "Library/SDK"
        elif any(w in desc for w in ["docker", "k8s", "kubernetes", "cloud", "infra", "deploy"]):
            arch = "Infrastructure/DevOps"
        else:
            arch = "Full-Stack App"

        stack = []
        if language:
            stack.append(language)
        for tech in ["python", "rust", "typescript", "javascript", "go", "react", "next.js", "vue", "pytorch"]:
            if tech in desc and tech.capitalize() not in stack:
                stack.append(tech.capitalize())
        if not stack:
            stack = ["Open Source"]

        return RepoIntelligence(
            key_value_proposition=description or f"Trending open-source repository {repo_name} on GitHub.",
            architecture_type=arch,
            tech_stack=stack[:5],
            license_risk="Low (Standard OSS)",
            production_score=78,
            quick_start_command=f"git clone https://github.com/{repo_name}.git",
        )
