# SOURCES — Provenance Ledger

**Hard rule:** No number ships in `market-research.md` or `index.html` without an entry here and in [`data/provenance.json`](./data/provenance.json). Value + source + URL + retrieval date for every figure. Modeled/derived numbers are labelled *modeled* with formula + base inputs (see [`data/models.json`](./data/models.json)).

- **Retrieval date for all live figures below:** **2026-06-30** (UTC `2026-06-30T15:53:54Z`)
- **Workstream:** PRO-19 / PRO-18 §4 + Appendix A
- **Machine-readable layer:** [`data/sources.json`](./data/sources.json) (locked catalog), [`data/*.json`](./data) (snapshots), [`data/provenance.json`](./data/provenance.json) (ledger), [`data/models.json`](./data/models.json) (formulas)

## Status legend
| status | meaning |
|---|---|
| ✅ verified | Re-fetched live on 2026-06-30 (HTTP 200) |
| 📦 snapshot | Real, but from a no-CORS/keyed/bot-blocked source — committed to `/data`, not live-fetched |
| ⏳ snapshot_pending | Real source exists but needs a key/scrape to stamp — **value left null, NOT invented** |
| ⚠️ legacy_unverified | From the Sept-2025 doc, uncited — **must be re-sourced or dropped before publish** |
| 🧮 modeled | Derived via a formula in `models.json`; labelled "your scenario"/"modeled" in the UI |

## Live = client-fetchable (CORS `*`) vs Snapshot
Every figure is tagged **live** (the site fetches it client-side, falling back to the committed snapshot on error) or **snapshot** (committed JSON only).

---

## ✅ Verified live figures (CoinGecko, DefiLlama, GitHub, npm, raw ERCs)

| Figure | Value | Source | URL | live/snapshot |
|---|---|---|---|---|
| AI-agents token category market cap | **$2.785 B** | CoinGecko | `api.coingecko.com/api/v3/coins/categories` | live |
| AI-agents category 24h volume | **$270.6 M** | CoinGecko | same | live |
| Artificial Intelligence category market cap | **$20.40 B** | CoinGecko | same | live |
| Top ai-agents token — Venice (VVV) mcap | **$595.3 M** | CoinGecko | `/coins/markets?category=ai-agents` | live |
| Bittensor (TAO) price / mcap | **$202.77 / $1.946 B** | CoinGecko | `/coins/markets?ids=bittensor` | live |
| ASI Alliance (FET) mcap | **$387.6 M** | CoinGecko | `/coins/markets?ids=fetch-ai` | live |
| Virtuals Protocol (VIRTUAL) mcap | **$345.3 M** | CoinGecko | `/coins/markets?ids=virtual-protocol` | live |
| elizaOS (ELIZAOS, ex-ai16z) mcap | **$4.0 M** | CoinGecko | `/coins/markets?ids=elizaos` | live |
| USDC circulating supply | **$73.77 B** | DefiLlama | `stablecoins.llama.fi/stablecoins` | live |
| Total stablecoin market cap | **$311.4 B** | DefiLlama | same | live |
| DeFi protocols tracked | **7,750** | DefiLlama | `api.llama.fi/protocols` | live |
| npm `x402` downloads / month | **1,076,390** | npm | `api.npmjs.org/downloads/point/last-month/x402` | live |
| npm `@coinbase/x402` downloads / month | **297,471** | npm | same pattern | live |
| npm `@elizaos/core` downloads / month | **82,593** | npm | same pattern | live |
| `x402-foundation/x402` stars (canonical) | **6,217** ★ (1,769 forks) | GitHub | `api.github.com/repos/x402-foundation/x402` | live |
| `coinbase/x402` stars (now a **fork**) | **96** ★ | GitHub | `api.github.com/repos/coinbase/x402` | live |
| `elizaOS/eliza` stars | **18,657** ★ | GitHub | `api.github.com/repos/elizaOS/eliza` | live |
| ERC-8004 (Trustless Agents) status | **Draft** (2025-08-13) | ethereum/ERCs | `raw.githubusercontent.com/.../erc-8004.md` | live |
| ERC-8001 (Agent Coordination Framework) status | **Final** (2025-08-02) | ethereum/ERCs | `raw.githubusercontent.com/.../erc-8001.md` | live |

### Corrections confirmed this run
- `coinbase/x402` is now a **fork (96★)** — the real signal repo is **`x402-foundation/x402` (6,217★)**.
- **ERC-8001 = Final**, **ERC-8004 = Draft** (8001 is further along).
- **DefiLlama `/raises` returns HTTP 402 (paid)** — funding comes from snapshot sources, not this endpoint.

---

## 📦 Snapshot figures — market-size spread (show 26.0%–49.6% CAGR, never one number)

Research-firm pages are server-rendered HTML (scrape build-time; Market.us & Grand View 403 to bots → press-release mirrors). Full table in [`data/market_size.json`](./data/market_size.json).

| Firm (report) | Base → Forecast | CAGR | URL |
|---|---|---|---|
| Fortune Business Insights — AI Agents | $8.03B (2025) → $251.38B (2034) | 46.61% | fortunebusinessinsights.com |
| Emergen — Agentic AI *(outlier-low)* | $5.20B (2025) → $52.40B (2035) | **26.0%** | emergenresearch.com |
| Roots Analysis — AI Agents | $15B (2026) → $221B (2035) | 34.64% | rootsanalysis.com |
| Precedence — AI Agents | $7.92B (2025) → $294.66B (2035) | 43.57% | precedenceresearch.com |
| Mordor — Agentic AI | $6.96B (2025) → $57.42B (2031) | 42.14% | mordorintelligence.com |
| Market.us — Agentic AI *(old-doc headline)* | $5.2B (2024) → $196.6B (2034) | 43.8% | market.us |
| Grand View — AI Agents *(outlier-high)* | $7.63B (2025) → $182.97B (2033) | **49.6%** | grandviewresearch.com |
| Grand View — Agentic Commerce *(crypto-thesis proxy)* | $5.7B (2025) → $65.5B (2033) | 35.7% | grandviewresearch.com |
| MarketsandMarkets — AI Agents | $5.26B (2024) → $52.62B (2030) | 46.3% | marketsandmarkets.com |

> The old doc's "$7B→$196.6B @ 43.8%" = **Market.us** — still valid but now 1 of ~9. The honest update is the **full 26.0%–49.6% spread**. Grand View's *Agentic Commerce* report is the closest mainstream proxy for the AI-agents-transacting thesis. No top-tier firm has a dedicated "AI-agent *crypto*" report — that angle is built from on-chain data (CoinGecko/DefiLlama/Dune) + qualitative sources, clearly labelled.

---

## ⏳ Snapshot pending (real source, needs key/scrape — value NOT invented)

| Figure | Source | Why pending |
|---|---|---|
| x402 on-chain $ volume | Dune (queries 6240463 / 6060125; ~95% on Base) | Keyed API — needs a free Dune key to stamp |
| Bittensor subnet detail | taostats `api.taostats.io` | Keyed (HTTP 401 without key); TAO **token** price is live via CoinGecko |
| Funding rounds | CryptoRank Sandbox API | Free key (10k credits/mo) needed; DefiLlama `/raises` is paid |
| Kalshi market odds | `api.elections.kalshi.com` | Server read 200 but **no browser CORS** → snapshot server-side |
| Polymarket "~100 AI-agent markets" | Polymarket Gamma | Generic scan found 1; must pull via the `ai-agent` tag. **Not asserted as 100.** |

---

## ⚠️ Legacy / unverified (from Sept-2025 doc — re-source or drop before publish)

| Figure | Old value | Action |
|---|---|---|
| 2025 segment split (algo 33.7% / call centers 30% / supply chain 25.7% / crypto 2.4% / other 8.2%) | uncited | Re-source or keep only as a reader-re-weightable default, labelled *unverified* |
| Enterprise agentic-AI adoption today | <1% | Re-source against a primary Gartner release |
| Enterprise adoption by 2028 | ~33% | Re-source against a primary Gartner release |
| "$15 trillion global economic impact by early 2030s" | uncited | Drop unless a primary source is found |

---

## 🧮 Modeled outputs
All projection/what-if outputs in the site are **modeled**, not measured — formulas, inputs, and bounds in [`data/models.json`](./data/models.json). CAGR slider bounds (26.0%–49.6%) and the default base ($8.03B, Fortune 2025) are real; the projected endpoints are the reader's scenario.

## Refresh
Live snapshots regenerated by [`data/build-snapshots.mjs`](./data/build-snapshots.mjs) (node, no deps). Keyed/snapshot sources require the relevant API key and are documented inline in `sources.json`.
