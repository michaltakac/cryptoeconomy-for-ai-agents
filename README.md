# Crypto Economy for AI Agents

### ▶ Read it live: **[michaltakac.github.io/cryptoeconomy-for-ai-agents](https://michaltakac.github.io/cryptoeconomy-for-ai-agents/)**

An explorable essay — *"Two economies, one name."* "The AI-agent economy" gets quoted as a single number, but it isn't one. Move the dials behind the headline and see which economy you were betting on. Every figure on the page traces back to a snapshot in this repo's [`data/`](./data/) folder.

## Overview

This repository contains comprehensive market research and analysis on the emerging intersection of cryptocurrency economics and AI agents. It documents how blockchain technology is enabling autonomous AI agents to participate in the global economy as independent economic actors.

## Purpose

The goal of this repository is to provide a thorough understanding of:
- Current infrastructure enabling AI agent economies (payment protocols, identity standards, etc.)
- Real-world applications and use cases already in production
- Market size, growth projections, and investment trends
- Technical standards and protocols being developed for agent-to-agent commerce

## Contents

### 📊 Market Research Document
[**market-research.md**](./market-research.md) - A comprehensive analysis covering:
- Infrastructure protocols (L402/x402, ERC-8004, ERC-8001)
- Application layer implementations
- UI/UX considerations for human-agent interactions
- Market projections (9-firm spread; 26%–49.6% CAGR; cited + retrieval-dated)
- Funding landscape and community initiatives

### 📈 Interactive Visualizations
[**market-graphs.html**](./market-graphs.html) - Interactive charts showing:
- Market growth projections (2024-2034)
- Current market segment breakdown
- Growth rate comparisons across research firms
- Enterprise adoption timeline

### 🧭 Explorable Essay (the live site)
[**index.html**](./index.html) — six interactive modules that let you move the assumptions behind each headline number (market-size spread, enterprise adoption S-curve, the x402 infrastructure breakout, token-cap vs. developer traction, and more). Served live at the URL above; no build step, runs as static HTML.

### 📄 Source Materials
- **cryptoeconomics-for-ai-agents-2025.pdf** - Original research document

## Data Layer & Provenance

The site has **no hidden numbers**. It is a static, build-free page (vanilla HTML + an ES-module [`app.js`](./app.js)) that runs on committed JSON snapshots in [`data/`](./data/) — these are the *floor*. Where a free public API exists (e.g. CoinGecko token caps), `app.js` attempts a live re-fetch with a short timeout and, on any failure, gracefully falls back to the committed snapshot. A per-figure badge tells you whether you're seeing **live** or **snapshot** data, so the page always renders — even offline, on a throttled network, or when an API is down.

Provenance is enforced, not aspirational:

- [**`data/provenance.json`**](./data/provenance.json) — the ledger. **Every figure** in the research doc and on the site has an entry mapping it to `{value, source, url, retrieval date, method}` with a `status` of `verified`, `modeled`, `snapshot_pending`, or `legacy_unverified`. No number ships without one.
- [**`data/models.json`**](./data/models.json) — the assumptions behind every *modeled* (interactive) figure, so the math you steer with the dials is inspectable.
- [**`SOURCES.md`**](./SOURCES.md) — the human-readable index of sources.
- [**`data/build-snapshots.mjs`**](./data/build-snapshots.mjs) — regenerates the snapshots from their sources.

The rule: if a number can't point to a verified or clearly-labeled-modeled entry in the ledger, it doesn't render.

## Key Findings (refreshed mid‑2026 — every figure cited + retrieval‑dated in [`market-research.md`](./market-research.md) and [`data/provenance.json`](./data/provenance.json))

- **Market size is a spread, not a number**: across 9 research‑firm editions (2025–2026), the AI‑agent / agentic‑AI market sits at ~$5–8B in 2025 with forward CAGRs of **26%–49.6%**. The old "$7B → $196.6B @ 43.8%" (Market.us) is still live but now the aggressive end of the range. "AI Agents," "Agentic AI," and "Agentic Commerce" are kept as distinct report families.
- **Enterprise adoption**: Gartner — agentic AI in <1% of enterprise apps (2024) → **33% by 2028**, but **>40% of agent projects expected cancelled by end‑2027**; McKinsey — **23% of orgs scaling**, ≤10% in any single function.
- **Infrastructure breakout — x402**: now an independent foundation (`x402-foundation/x402`, 6,217★), **npm ~1.08M downloads/month**, **100M+ on‑chain transactions on Base** (meme‑inflated). **ERC‑8001 Final, ERC‑8004 Draft** (Aug 2025).
- **Crypto‑native slice is small & cooled**: CoinGecko "AI Agents" token category **~$2.8B** total cap (TAO ~$1.95B, FET ~$387M, VIRTUAL ~$345M).
- **Economic‑impact attribution fixed**: the "$15.7T by 2030" figure is **PwC** (total AI), not McKinsey — McKinsey's gen‑AI estimate is **$2.6–4.4T/yr**.

## Technologies Covered

- **Payment Rails**: HTTP 402 protocols (L402, x402) enabling machine-to-machine micropayments
- **Identity & Trust**: Ethereum standards for agent identity, reputation, and validation
- **Cross-Chain Infrastructure**: High-performance blockchains optimized for agent interactions
- **Decentralized Marketplaces**: Token economies for AI service discovery and consumption

## Contributing

This is an evolving space with rapid developments. Contributions, updates, and corrections are welcome via pull requests.

## License

This research is provided for informational purposes. Please cite this repository when using the research.

---

*Last Updated: June 30, 2026*