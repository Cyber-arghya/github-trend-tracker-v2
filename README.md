# GitHub Trend Tracker V2 🚀

[![CI/CD Scraper Pipeline](https://github.com/Cyber-Arghya/github-trend-tracker-v2/actions/workflows/automate.yml/badge.svg)](https://github.com/Cyber-Arghya/github-trend-tracker-v2/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![Vite + React](https://img.shields.io/badge/Vite-React%2019-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Storage-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)

An autonomous, high-performance GitHub Trending intelligence system that captures Daily, Weekly, and Monthly trending repositories, persists relational historical trajectories in PostgreSQL, offloads raw markdown documentation into **Supabase Storage**, extracts structured architectural intelligence with **Gemini 2.5 Flash**, and surfaces an **All-Time Trending Power Leaderboard** on a modern React dashboard.

---

## 🌟 Key Features

1. **🏆 All-Time Trending Power Leaderboard:**
   - Real-time ranking across all tracked repositories using a mathematically-sound, time-decayed scoring algorithm.
   - Computes peak rank, appearance breakdown (Daily, Weekly, Monthly), and historical momentum.

2. **⚡ High-Speed Async Ingestion:**
   - Powered by `httpx` and `parsel` (lxml CSS selectors) scraping GitHub Trending across all periods in under 2 seconds.

3. **📦 Supabase Storage README Offloading:**
   - Raw multi-megabyte `README.md` files are streamed into the Supabase Storage bucket `readmes/` (`readmes/{owner}_{repo}.md`).
   - Database rows remain lean and lightning-fast with direct storage references.

4. **🧠 Gemini 2.5 Flash Structured AI Intelligence:**
   - Analyzes project blueprints with Pydantic JSON schemas.
   - Extracts architecture category (CLI, AI/ML Framework, SDK), tech stack pills, license risks, and production readiness scores (1-100).

5. **💻 Modern React 19 + Tailwind Dashboard:**
   - Client-side sorting, language pills, instant search, responsive snapshot cards, and an in-app viewer for Supabase Storage READMEs.
   - Deployed on **Vercel** with sub-second page loads.

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

## 🗄️ Database & Supabase Storage Setup

### 1-Click Supabase Initialization:
1. Open your Supabase Project: [https://supabase.com/dashboard/project/gnpauzccwwndavoqddzv/sql](https://supabase.com/dashboard/project/gnpauzccwwndavoqddzv/sql)
2. Copy the entire contents of [`supabase/schema.sql`](file:///c:/Users/worka/Desktop/test/github-trend-tracker-v2/supabase/schema.sql).
3. Paste into the SQL Editor and click **Run**.
4. This script automatically:
   - Creates the `repositories` table with relational foreign keys.
   - Creates the `trending_snapshots` table.
   - Creates high-performance indexes.
   - Creates the `mv_all_time_leaderboard` Materialized View.
   - Creates and exposes the public Supabase Storage bucket `readmes`.
   - Configures Row Level Security (RLS) policies for secure public access.

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
SUPABASE_STORAGE_BUCKET=readmes
GEMINI_API_KEY=your-gemini-api-key
```

### 2. Run the Ingestion Pipeline
```bash
# Sync dependencies
uv sync

# Run tests
uv run pytest -v

# Run dry-run (simulation without database writes)
uv run python -m scraper.main --period all --dry-run

# Run full ingestion (uploads READMEs to Storage & populates PostgreSQL)
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
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy from repository root
vercel deploy --prod
```
The root `vercel.json` automatically orchestrates the subdirectory build:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm --prefix dashboard run build",
  "outputDirectory": "dashboard/dist",
  "installCommand": "npm --prefix dashboard install"
}
```

---

## 🤖 GitHub Actions Automated Ingestion

The repository includes `.github/workflows/automate.yml` which triggers automatically every 6 hours (`0 */6 * * *`) via GitHub Actions.

### Required GitHub Secrets:
Add the following under **Settings ➔ Secrets and variables ➔ Actions**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (recommended for backend cron writes)
- `GEMINI_API_KEY`

