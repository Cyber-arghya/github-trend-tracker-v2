# GitHub Trend Tracker V2 🚀

[![CI/CD Scraper Pipeline](https://github.com/Cyber-Arghya/github-trend-tracker-v2/actions/workflows/automate.yml/badge.svg)](https://github.com/Cyber-Arghya/github-trend-tracker-v2/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![Vite + React](https://img.shields.io/badge/Vite-React%2019-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![NVIDIA Nemotron](https://img.shields.io/badge/NVIDIA-Nemotron%20550B-76B900?logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)

An autonomous, zero-storage GitHub Trending intelligence system that captures Daily, Weekly, and Monthly trending repositories, persists relational historical trajectories in PostgreSQL, extracts structured architectural intelligence using **NVIDIA Nemotron-3-Ultra-550B** (with **Gemini 2.5 Flash** fallback), and surfaces an **All-Time Trending Power Leaderboard** on a modern React dashboard.

---

## 🌟 Key Features

1. **🏆 All-Time Trending Power Leaderboard:**
   - Real-time ranking across all tracked repositories using a mathematically-sound, time-decayed scoring algorithm.
   - Tracks peak rank, appearance breakdown (Daily, Weekly, Monthly), and breakout velocity.

2. **⚡ Zero-Storage Lightweight Ingestion:**
   - No multi-megabyte README files downloaded or stored.
   - Extracts high-density metadata directly from GitHub Trending cards in under 2 seconds.

3. **🧠 Multi-Tier AI Intelligence Engine:**
   - **Primary Model:** NVIDIA Nemotron-3-Ultra-550B (`nvidia/nemotron-3-ultra-550b-a55b`).
   - **Fallback Model:** Google Gemini 2.5 Flash.
   - **Offline Fallback:** Rule-based keyword heuristics.
   - Extracts architecture category (CLI Tool, AI/ML Framework, Library/SDK), translated English TL;DR, tech stack pills, and production readiness scores (1-100).

4. **💻 Modern React 19 + Tailwind Dashboard:**
   - Real-time search, multi-column sorting, language filtering, live snapshot views, and direct repository links.
   - Deployed on **Vercel** with sub-second page loads: [https://github-trend-tracker-v2.vercel.app](https://github-trend-tracker-v2.vercel.app)

---

## 📐 Architecture & Mathematical Formula

### The All-Time Trending Power Score Formula
$$\text{Trending Power Score} = \sum_{s \in \text{Snapshots}} \left( (26 - \text{Rank}_s) \times W_{\text{Period}} \times e^{-\lambda \Delta t} \right) + \alpha \log_{10}(\text{Stars})$$

- $\text{Rank}_s$: Rank on GitHub trending page (1 to 25).
- $W_{\text{Period}}$: Period weighting ($1.0$ for Daily, $2.5$ for Weekly, $5.0$ for Monthly).
- $\lambda = 0.015$: Exponential half-life decay constant (preserves momentum while favoring active breakouts).
- $\alpha \log_{10}(\text{Stars})$: Sub-linear baseline credibility dampener.

Implemented natively in PostgreSQL via `CREATE MATERIALIZED VIEW public.mv_all_time_leaderboard`.

---

## 🚀 Local Quickstart

### Prerequisites:
- [Python 3.12+](https://python.org) & [uv](https://github.com/astral-sh/uv)
- [Node.js 18+](https://nodejs.org) & npm

### 1. Clone & Configure Environment
```bash
git clone https://github.com/Cyber-Arghya/github-trend-tracker-v2.git
cd github-trend-tracker-v2

# Copy environment template
cp .env.example .env
```

Ensure `.env` contains:
```ini
SUPABASE_URL=https://gnpauzccwwndavoqddzv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

NVIDIA_API_KEY=nvapi-...
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b

GEMINI_API_KEY=
```

### 2. Run the Ingestion Pipeline
```bash
# Sync dependencies
uv sync

# Run tests
uv run pytest -v

# Run live ingestion with NVIDIA Nemotron
uv run python -m scraper.main --period all
```

### 3. Run the Frontend Dashboard
```bash
cd dashboard
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploy to Vercel

```bash
vercel deploy --prod
```

Production Dashboard: [https://github-trend-tracker-v2.vercel.app](https://github-trend-tracker-v2.vercel.app)

---

## 🤖 Automated Cron Ingestion (VC Radar)

GitHub Actions automatically runs the scraper pipeline **6 times every 24 hours (every 4 hours)** via `.github/workflows/automate.yml`:
- **Schedule:** `0 */4 * * *` (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
- Captures new breakout repos and updates star velocity metrics.
