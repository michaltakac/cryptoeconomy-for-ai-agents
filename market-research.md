# Crypto Economics for AI Agents: State of the Market (mid‑2026)

> **Last refreshed:** 2026‑06‑30 · **Supersedes** the September‑2025 edition.
> **Provenance discipline:** Every quantitative claim below carries an inline source and a **retrieval date**. Machine‑readable figures live in the shared data layer maintained by the Data Acquisition workstream — [`data/provenance.json`](./data/provenance.json) (the ledger), [`SOURCES.md`](./SOURCES.md) (the human‑readable index), [`data/market_size.json`](./data/market_size.json), [`data/ai_agent_tokens.json`](./data/ai_agent_tokens.json), [`data/funding.json`](./data/funding.json), and [`data/models.json`](./data/models.json) (projection formulas). Every number here is cross‑checked against that ledger. Following the ledger’s status legend, figures fetched from a primary/reputable source on 2026‑06‑30 are marked **[V]** (= ledger `verified`); figures that are snapshot‑only, platform‑self‑reported, or whose primary page blocked automated retrieval (Gartner, Grand View, Market.us all 403 bots; some Dune/x402scan dashboards are client‑rendered and need an API key) are marked **[~]** (= ledger `snapshot` / `snapshot_pending` — re‑confirm before quoting as fact). Where research firms disagree we show the **spread**, never a single cherry‑picked number.

---

## 0. Executive summary — what mid‑2026 signal actually says

- **The market‑size debate is wider, not narrower.** Across nine 2025–2026 research‑firm editions, the AI‑agent / agentic‑AI market is pegged at roughly **$5–8B in 2025**, with forward CAGRs spanning **26% to ~49%** depending on definition and firm. The old doc’s “$7B → $196.6B @ 43.8%” is *still live* — it traces to **Market.us (Agentic AI)** — but it now sits at the **aggressive end** of a much broader distribution (§2). Treat any single number as one vote, not the consensus.
- **“AI Agents,” “Agentic AI,” and “Agentic Commerce” are three different report families** with different base years and definitions. Conflating them is the single most common error in secondary coverage; we keep them separate throughout (§2).
- **The crypto‑native slice is small and has cooled.** The CoinGecko “AI Agents” token category is **~$2.80B total market cap** (2026‑06‑30) [V] — a fraction of the broad AI‑agent software TAM and well off its early‑2025 peak. Token leaders: Bittensor (TAO) ~$1.95B, Fetch/ASI (FET) ~$387M, Virtuals (VIRTUAL) ~$345M (§5).
- **The real infrastructure breakout of the last year is x402.** The HTTP‑402 stablecoin payment standard went from a Coinbase experiment to an independent foundation: **npm `x402` ≈ 1.08M downloads/month**, repo `x402-foundation/x402` at **6,217★**, and **100M+ cumulative on‑chain transactions on Base through Q1 2026** [V] — though that transaction count is heavily inflated by one meme‑coin pay‑to‑mint and is *not* clean agent‑commerce demand (§6).
- **Enterprise adoption is early but the curve is real and now better‑sourced.** Gartner: agentic AI in **<1% of enterprise apps in 2024 → 33% by 2028** [V/~]; McKinsey: **23% of orgs scaling** an agentic system but **≤10% in any single function** [V]; and a sobering counter‑signal — Gartner expects **>40% of agentic‑AI projects cancelled by end‑2027** [V] (§4).
- **Standards are maturing on Ethereum:** **ERC‑8001 “Agent Coordination Framework” is Final**; **ERC‑8004 “Trustless Agents” is Draft** (both created Aug 2025) [V] (§6).

---

## 1. Infrastructure and Protocol Layer

**Micropayment Protocols (HTTP 402 — L402 / x402).** The core building block remains the revival of the long‑dormant HTTP `402 Payment Required` status code as a machine‑to‑machine payment rail. On Bitcoin, **L402** (formerly LSAT) combines Lightning payments with bearer macaroon tokens to charge sats per API request, metering usage without accounts ([Lightning Labs docs](https://docs.lightning.engineering/the-lightning-network/l402), retrieved 2026‑06‑30). In the Ethereum / multi‑chain world, **x402** (introduced by Coinbase, May 2025) repurposes the same status code for stablecoin payments: a resource server answers a request with `402` plus payment instructions, the client (human or agent) makes an on‑chain payment — typically USDC on a fast L2 — and retries with proof of payment in an HTTP header. The design is chain‑agnostic, open‑source, and integrable as a single line of middleware ([x402.org](https://www.x402.org/); [coinbase x402 whitepaper](https://www.x402.org/x402-whitepaper.pdf), retrieved 2026‑06‑30). This makes pay‑per‑call, pay‑per‑article, and pay‑per‑second‑of‑compute economically viable where card rails (latency, fees, minimum charges) could not.

The **maturity signal on x402 is now measurable** (all retrieved 2026‑06‑30, primary APIs):

| Signal | Value | Source |
|---|---|---|
| npm `x402` downloads, last month | **1,076,390** [V] | `api.npmjs.org/downloads/point/last-month/x402` |
| npm `@coinbase/x402` downloads, last month | **297,471** [V] | `api.npmjs.org/.../@coinbase/x402` |
| GitHub `x402-foundation/x402` | **6,217★ / 1,769 forks** [V] | `api.github.com/repos/x402-foundation/x402` |
| Governance shift | **`coinbase/x402` is now a fork** (96★) of the foundation repo | `api.github.com/repos/coinbase/x402` |
| On‑chain transactions | **100M+ cumulative on Base through Q1 2026** [V] | [Chainalysis, 2026‑06‑03](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/) |

> **Honesty caveat on x402 volume.** The 100M+ transaction figure is real but **dominated by a single meme‑coin “pay‑to‑mint” (PING)** that spiked ~10,000% in a week in Q4 2025 — not sustained agent‑commerce demand; activity has since consolidated ([Chainalysis](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/), 2026‑06‑30). **Cumulative USD volume and the precise Base‑share split could not be verified from a primary source** — the canonical explorer x402scan.com and the Dune dashboards (`dune.com/hashed_official/x402-analytics`, query `6240463`) are client‑rendered and require a Dune API key. We therefore report the transaction *count* (Chainalysis‑sourced) and the npm/GitHub adoption proxies, and explicitly **do not publish an unverified dollar‑volume number.** Base is the dominant deployment chain; x402 is also live on Solana, Stellar, Arbitrum, Polygon and Ethereum [~].

**Ethereum Agent Standards (ERC‑8004 & ERC‑8001).** Two complementary standards advanced materially since the last edition (statuses verified verbatim from the canonical `ethereum/ERCs` repo headers, retrieved 2026‑06‑30):

- **ERC‑8004 “Trustless Agents” — Status: Draft** (created 2025‑08‑13) ([eip‑8004 source](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-8004.md)). Introduces on‑chain registries for agent **Identity** (a global on‑chain ID + off‑chain AgentCard), **Reputation** (feedback attestations), and **Validation** (stake‑backed or TEE‑attested verification of an agent’s results), so agents from different organizations can discover and trust each other without prior relationships. Payments are deliberately *orthogonal* — left to rails like x402 — though payment receipts can feed reputation.
- **ERC‑8001 “Agent Coordination Framework” — Status: Final** (created 2025‑08‑02) ([eip‑8001 source](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-8001.md)). A single‑chain primitive for multi‑party agent coordination: an initiator posts an EIP‑712‑signed *intent*, participants return verifiable acceptance attestations, and the action becomes executable only when all required acceptances are present and current. (The community discussion thread is titled “Secure Intents,” which is why earlier drafts of this report referred to it that way.)

> **Correction vs the Sept‑2025 edition:** the old doc described both ERCs as “still in draft.” As of 2026‑06‑30 the canonical repo headers show **ERC‑8001 = Final, ERC‑8004 = Draft** — i.e. the *coordination* standard is further along than the *trust/identity* standard.

**High‑performance agent chains and a dedicated agent L1.** Purpose‑built infrastructure kept forming. The clearest signal is **Kite** (formerly Zettablock), an L1 for autonomous‑agent payments and identity, which **raised an $18M Series A led by PayPal Ventures and General Catalyst (2025‑09‑02; ~$33M cumulative)**, with Coinbase Ventures joining a follow‑on ([PayPal newsroom](https://newsroom.paypal-corp.com/2025-09-02-Kite-Raises-18M-in-Series-A-Funding-To-Enforce-Trust-in-the-Agentic-Web), retrieved 2026‑06‑30). Established networks remain relevant: **Bittensor (TAO)** — a decentralized network of incentivized AI subnets — trades at **~$1.95B market cap** (price ~$202.80, 9.60M of 21M TAO circulating; CoinGecko rank #41) ([CoinGecko](https://www.coingecko.com/en/coins/bittensor), 2026‑06‑30) [V], reportedly expanded from 128→256 subnets in 2026 [~]. The bulk of x402 settlement still runs on **Base** (Coinbase’s OP‑Stack L2) with USDC.

---

## 2. Market Size and Growth Projections — show the spread

There is **no single authoritative number**. Below are the latest editions we could locate per firm, retrieved 2026‑06‑30. **Three report families exist and are kept distinct.** Base years and end years differ, so the values are *not* directly comparable — read the CAGR and the definition, not just the headline.

### 2.1 “AI Agents” family

| Firm (report) | Base → Forecast | CAGR | Verify | Source (retrieved 2026‑06‑30) |
|---|---|---|---|---|
| **Fortune Business Insights** — AI Agents | $8.03B (2025) → $251.38B (2034) | 46.61% | **[V]** fetched | [fortunebusinessinsights.com](https://www.fortunebusinessinsights.com/ai-agents-market-111574) |
| **Precedence Research** — AI Agents | $7.92B (2025) → $294.66B (2035) | 43.57% | **[V]** fetched | [precedenceresearch.com](https://www.precedenceresearch.com/ai-agents-market) |
| **Roots Analysis** — AI Agents | $15B (**2026** base) → $221B (2035) | 34.64% | **[V]** fetched | [rootsanalysis.com](https://www.rootsanalysis.com/AI-Agents-Market) |
| **MarketsandMarkets** — AI Agents | $7.84B (2025) → $52.62B (2030) | 46.3% | **[V]** via PRNewswire | [prnewswire.com](https://www.prnewswire.com/news-releases/ai-agents-market-worth-52-62-billion-by-2030---exclusive-report-by-marketsandmarkets-302435486.html) |
| **Grand View Research** — AI Agents (most‑cited edition) | → $50.31B (2030) | 45.8% (2025–30) | **[V]** via PRNewswire | [prnewswire.com](https://www.prnewswire.com/news-releases/ai-agents-market-size-to-hit-50-31-billion-by-2030-at-cagr-45-8---grand-view-research-inc-302447060.html) |
| **Grand View Research** — AI Agents (current site, 2026–2033 ed.) | $7.63B (2025) → $182.97B (2033) | 49.6% | **[~]** snippet (page 403s bots) | [grandviewresearch.com](https://www.grandviewresearch.com/industry-analysis/ai-agents-market-report) |

### 2.2 “Agentic AI” family

| Firm (report) | Base → Forecast | CAGR | Verify | Source (retrieved 2026‑06‑30) |
|---|---|---|---|---|
| **Market.us** — Agentic AI *(the old doc’s number)* | $5.2B (2024) → $196.6B (2034) | 43.8% | **[V]** via scoop.market.us mirror | [scoop.market.us](https://scoop.market.us/agentic-ai-market-news/) |
| **Mordor Intelligence** — Agentic AI | $6.96B (2025) → $57.42B (2031) | 42.14% | **[V]** fetched | [mordorintelligence.com](https://www.mordorintelligence.com/industry-reports/agentic-ai-market) |
| **Emergen Research** — Agentic AI | $5.20B (2025) → $52.40B (2035) | 26.0% *(outlier‑low)* | **[V]** fetched | [emergenresearch.com](https://www.emergenresearch.com/industry-report/agentic-artificial-intelligence-market) |

### 2.3 “Agentic Commerce” family (closest proxy to the *agents‑transacting* thesis)

| Firm (report) | Base → Forecast | CAGR | Verify | Source (retrieved 2026‑06‑30) |
|---|---|---|---|---|
| **Grand View Research** — Agentic Commerce | $5.7B (2025) → $65.5B (2033) | 35.7% | **[~]** snippet (page 403s bots) | [grandviewresearch.com](https://www.grandviewresearch.com/industry-analysis/agentic-commerce-market-report) |

**How to read this:**
- **The spread is the finding.** 2034/2035 forecasts range from **~$52B (Emergen) to ~$295B (Precedence)** — a 5–6× gap driven by definition and assumed CAGR (26%–49.6%). Anyone citing one number is cherry‑picking.
- **Market.us’s “$5.2B → $196.6B @ 43.8%” is confirmed exactly** against a fetched mirror, so the old doc’s headline is *real and current* — just no longer the consensus.
- **Base‑year mismatch:** Fortune BI / Precedence / MnM use 2025 (~$7.8–8.0B); Roots uses **2026** ($15B); Market.us uses **2024** ($5.2B). Don’t line them up naively.
- **Edition drift is rampant**, especially Grand View (its AI‑Agents report alone has run $3.86B/2023→$50.31B/2030 @45.1%, then 45.8%, then a current 49.6%‑to‑2033 cut). Always pin the edition. Grand View and Market.us **block automated fetches**, so their newest cuts are snippet‑grade until manually loaded.
- **Emergen is the low outlier** (26% CAGR). Note: its *prior* edition circulated as “$30.89B/2024 → $438.68B/2033 @ ~31.6%”; the **live page today shows the sharply revised‑down $5.2B → $52.4B**, so older citations of the big Emergen number are stale.

> *Replaces the old doc’s three‑point “Conservative / Base / Optimistic” framing, which mixed firms and a since‑revised Emergen figure.*

---

## 3. Market Segments and Application Splits

Granular dollar splits by application are **not** published cleanly by the major firms — most give qualitative “dominated the market” language rather than percentages. What is sourced (Grand View Research AI‑Agents report, via PRNewswire mirror, retrieved 2026‑06‑30) [V]:

- **By technology:** machine learning “dominated… accounting for **over 29% of global revenue** in 2024” — the only hard percentage GVR publishes for this report.
- **By application:** **customer service & virtual assistants** dominated in 2024; other tracked applications: healthcare, financial services, robotics/automation, security & surveillance, marketing/sales, HR, legal/compliance, gaming.
- **By agent system:** single‑agent systems dominated 2024 (multi‑agent tracked).
- **By type:** ready‑to‑deploy agents dominated 2024 (build‑your‑own tracked).
- **By end use:** enterprise dominated 2024 (vs consumer / industrial).
- **By region:** North America held the largest share in 2024.

> **What we deliberately do *not* carry forward:** the Sept‑2025 edition’s precise segment dollar split (“Algorithmic Trading $2.36B / AI Call Centers $2.1B / Supply Chain $1.8B / Crypto Bots $0.17B …”). We could **not** re‑verify those figures against any current primary source, so per the no‑hallucination rule they are dropped rather than restated. The defensible 2024 read is **customer service & enterprise‑first, ML‑led, North‑America‑led**, with the dollar split unpublished. Cloud‑vs‑on‑prem and vertical (BFSI/retail/IT) percentages are **[~] unverified** — the GVR pages carrying them 403 bots.

---

## 4. Enterprise Adoption Curve

The headline adoption story from the old doc holds up and is now better‑sourced — but it comes with a hard reality check.

**Gartner** (press release 2025‑06‑25, “*Over 40% of Agentic AI Projects Will Be Canceled by End of 2027*”; gartner.com 403s bots, verified via mirrors, retrieved 2026‑06‑30):
- **“33% of enterprise software applications will include agentic AI by 2028, up from less than 1% in 2024.”** The 33%/2028 figure is **[V]** (mirror); the “<1% in 2024” tail is **[~]** (appears in the release snippet but not on the fetched mirror) ([MES Computing mirror](https://www.mescomputing.com/news/ai/5-predictions-about-agentic-ai-from-gartner)).
- **“At least 15% of day‑to‑day work decisions will be made autonomously via agentic AI by 2028”** (from ~0% in 2024) [V/~].
- **Counter‑signal: “Over 40% of agentic‑AI projects will be canceled by end‑2027,”** citing escalating cost, unclear value, and weak risk controls [V] ([Predictive Analytics World mirror](https://www.predictiveanalyticsworld.com/machinelearningtimes/gartner-predicts-over-40-of-agentic-ai-projects-will-be-canceled-by-end-of-2027/13875/)). In a Jan‑2025 Gartner poll of 3,412, only ~130 of thousands of “agentic” vendors were judged to be building something real.

**McKinsey** — *The State of AI in 2025: Agents, innovation, and transformation* (Nov 2025; via Forbes mirror, retrieved 2026‑06‑30) [V] ([Forbes](https://www.forbes.com/sites/josipamajic/2026/03/22/10-of-enterprise-functions-use-ai-agents-mckinsey-finds/)):
- **23% of organizations are scaling** at least one agentic‑AI system; **39% are experimenting** (≈62% at least piloting).
- But **no more than ~10% of respondents report scaling agents in any single business function** — depth lags breadth.

**Deloitte** — *State of Generative AI in the Enterprise* (2026 wave, published 2026‑04‑24; 3,235 leaders / 24 countries; fetched) [V] ([Deloitte](https://www.deloitte.com/us/en/insights/topics/emerging-technologies/ai-agents-scaling-faster.html)):
- Only **21% report a mature governance model** for agentic AI (≈80% lack one).
- By 2027, respondents expect **74% at least moderate** agent use, **23% extensive**, **5% full business integration**.
- Deloitte’s 2025 prediction of **25% of GenAI adopters running agent pilots in 2025 → 50% by 2027** is **[~]** (consistent across snippets, primary not fetched).

> **Net read:** the “<1% → ~33% by 2028” arc is genuine and now corroborated across Gartner/McKinsey/Deloitte, but mid‑2026 reality is *early pilots, shallow per‑function depth, weak governance, and a coming cull of failed projects.* Present it as an S‑curve with real attrition, not a straight line to 65%.

---

## 5. The Crypto‑Native AI‑Agent Economy (on‑chain)

No top‑tier research firm publishes a dedicated “AI‑agent **crypto**” market size, so this slice is built bottom‑up from on‑chain/token data and clearly labeled as such. The headline: **it is small relative to the software TAM, and it has cooled from its early‑2025 hype peak.**

- **CoinGecko “AI Agents” token category:** **~$2.80B total market cap**, ~$271M 24h volume (2026‑06‑30) [V] ([CoinGecko categories API](https://api.coingecko.com/api/v3/coins/categories)). For scale, that entire crypto category is *smaller than a single year’s revenue assumption* in most of the §2 software forecasts.
- **Token leaders (CoinGecko, 2026‑06‑30, all [V]):**

| Token | Market cap | Price | Note |
|---|---|---|---|
| **Bittensor (TAO)** | ~$1.95B | $202.80 | Decentralized AI subnets; rank #41 |
| **Fetch / ASI Alliance (FET)** | ~$387M | $0.1717 | rank #117; see merger note |
| **Virtuals Protocol (VIRTUAL)** | ~$345M | $0.5253 | Agent‑launch platform on Base; rank #123 |
| **elizaOS (ELIZAOS, ex‑ai16z)** | ~$3.96M | $0.00053 | Token collapsed from peak; framework still active |

- **ASI Alliance status [~]:** the Fetch.ai + SingularityNET + Ocean “Artificial Superintelligence Alliance” token merger went live in 2024; **Ocean Protocol Foundation withdrew in Oct 2025**; the final FET→ASI ticker rebrand remains roadmap‑pending. (2026 reporting also references an Ocean‑vs‑Fetch token dispute — flagged for editorial check, not asserted here.)
- **Virtuals Protocol [~]:** the largest agent‑launch platform reports on the order of **17,000–18,000+ agents launched** and a self‑reported cumulative “agentic GDP” in the high‑hundreds of millions, but figures are platform‑reported and conflicting across sources ([Tiger Research](https://reports.tiger-research.com/p/virtuals-protocol-acp-eng), 2026‑06‑30); its token (~$345M) is well off peak and monthly protocol revenue reportedly fell sharply through 2025. Treat all platform‑GDP claims as directional.
- **elizaOS:** the open‑source agent framework remains healthy as *software* — **`elizaOS/eliza` 18,657★ / 5,573 forks**, **npm `@elizaos/core` 82,593 downloads/month** (2026‑06‑30) [V] — even as the associated token (rebranded ai16z→ELIZAOS) collapsed to ~$4M mcap. A clean example of **developer traction decoupling from token price.**

> **Takeaway:** the durable signal in crypto‑native agents is **infrastructure and developer adoption (x402, elizaOS, Bittensor subnets)**, not token market caps, which round‑tripped through a 2024–25 hype cycle.

---

## 6. Funding Landscape

**No verifiable single “crypto + AI‑agent total VC” figure exists** for 2025 or H1 2026 — CryptoRank/Messari/Galaxy did not yield a confirmable subtotal, and DefiLlama’s `/raises` endpoint is now paywalled (HTTP 402). We therefore report (a) the all‑AI topline and (b) named, individually‑sourced rounds.

**Topline (CB Insights, *State of AI 2025*, fetched 2026‑06‑30)** [V] ([cbinsights.com](https://www.cbinsights.com/research/report/ai-trends-2025/)):
- **$225.8B total private AI venture funding in 2025** (~2× 2024); LLM developers took ~41% (~$92.4B); OpenAI + Anthropic + xAI alone = $86.3B (38%). AI‑agent/infra was **~10% of 2025 AI acquisitions**. *(This is all‑AI, not agent‑specific — do not present as an agent‑only figure.)*
- Q1 2025 blockchain/crypto VC ~$4.8B (strongest since 2022) — context only, not crypto‑AI‑specific [~].

**Named rounds in the agent / crypto‑agent payments space** (each primary‑ or reputable‑sourced, retrieved 2026‑06‑30):

| Company | Round | Amount | Lead(s) | Date | Source |
|---|---|---|---|---|---|
| **Kite** (agent‑payments L1) | Series A | $18M ($33M cum.) | PayPal Ventures, General Catalyst | 2025‑09‑02 | [PayPal newsroom](https://newsroom.paypal-corp.com/2025-09-02-Kite-Raises-18M-in-Series-A-Funding-To-Enforce-Trust-in-the-Agentic-Web) [V] |
| **Catena Labs** (AI‑native bank) | Seed → Series A | $18M → $30M ($48M+ cum.) | a16z crypto; Acrew (A) | 2025‑05 → 2026‑05 | [Fortune](https://fortune.com/2026/05/20/catena-labs-series-a-sean-neville-ai-native-bank/) [V] |
| **Nous Research** | Series A | $50M @ $1B token val. | Paradigm | 2025‑04 | [Fortune Crypto](https://fortune.com/crypto/2025/04/25/paradigm-nous-research-crypto-ai-venture-capital-deepseek-openai-blockchain/) [V] |
| **Sentient** | Seed | $85M | Founders Fund, Pantera, Framework | 2024‑07 | [CoinDesk](https://www.coindesk.com/business/2024/07/02/peter-thiels-founders-fund-leads-85m-seed-investment-into-open-source-ai-platform-sentient) [V] |
| **Story Protocol** (PIP Labs) | Series B | $80M @ $2.25B ($140M cum.) | a16z crypto | 2024‑08 | [CoinDesk](https://www.coindesk.com/business/2024/08/21/story-protocol-developer-raises-80m-series-b-led-by-a16z-for-intellectual-property-chain) [V] |
| **Skyfire** (agent payments) | Seed | $8.5M ($9.5M w/ a16z CSX) | Brevan Howard Digital, Circle, Ripple | 2024‑08 | [Finextra](https://www.finextra.com/newsarticle/44621/skyfire-raises-85m-to-bring-autonomous-payments-to-ai-agents) [V] |

> **Could not verify a discrete VC round** for Virtuals, elizaOS/Eliza Labs, Payman, or Halliday — Virtuals and elizaOS are token‑funded rather than conventional equity raises. Per the no‑hallucination rule, these are listed as **unverified** rather than assigned a number. **Catena’s two rounds are distinct** — do not merge or double‑count.

---

## 7. Application Layer and Market Sentiment

**Application layer.** The pay‑as‑you‑go pattern the old doc described (agents paying per API call/article/dataset via 402, no subscriptions) is now backed by real rails (x402 npm at 1.08M downloads/mo, §1) and a live multi‑chain ecosystem (Base‑led; a Stripe x402 integration shipped Feb 2026 [~]; an x402 Foundation now lists Coinbase, Cloudflare, Google, Visa, AWS, Circle and Anthropic among participants [~] — [The Block](https://www.theblock.co/learn/391983/what-is-coinbases-x402-protocol), 2026‑06‑30). Agent‑marketplace and on‑chain‑finance use cases (SingularityNET/Fetch lineage, DeFi agent stacks with policy‑guarded keys) persist, but the breakout adoption metric of the year is **payment‑rail downloads and on‑chain transaction counts, not marketplace GMV.**

**Market sentiment — prediction markets.** Crowd‑sourced odds are a useful real‑time sentiment gauge:

- **Polymarket (gamma API, fetched live 2026‑06‑30)** [V]: in the “Which company has the best AI model (end of June)?” event, **Anthropic priced at 99.8% YES** with $2.45M on that leg (total event volume across legs in the millions; Z.ai leg carried the highest single volume at ~$5.1M) ([gamma‑api.polymarket.com](https://gamma-api.polymarket.com/events?slug=which-company-has-best-ai-model-end-of-june)).
- **Polymarket category level [~]** (platform pages, re‑confirm before quoting): an “AI Agent” predictions category with ~**100+ active markets and ~$28.6M cumulative volume**; a separate “AGI” category (~103 markets); and an actively‑traded “**Will the AI bubble burst by end‑2026?**” market (~27% implied) — a direct read on bubble anxiety.
- **Kalshi [~]** (market pages, snippet‑grade): a “best AI model” complex (~$6M volume) with **Claude favored ~65%**; “top AI company” with Anthropic ~57% vs OpenAI ~34%.

> Only the API‑fetched Polymarket event is **[V]**; category totals and Kalshi figures are **[~]** and should be re‑pulled live before being quoted as fact.

---

## 8. Macro Framing — get the attributions right

The old edition leaned on big round numbers. Two corrections, verified 2026‑06‑30:

- **Jensen Huang — agentic AI as a “multi‑trillion‑dollar opportunity,” “the age of AI agentics is here.” REAL.** Said at the **CES 2025 keynote (Jan 6–7, 2025)** ([Fortune](https://fortune.com/2025/01/06/nvidias-jensen-huang-agentics-ai-robots-blackwell-gpu-ces-2025-toyota-autonomous-vehicles/)).
- **The “$15 trillion economic impact” figure — fix the attribution.** This is **not** a McKinsey generative‑AI number. The widely‑cited **$15.7T by 2030 is PwC’s 2017 “Sizing the Prize” total‑AI GDP estimate**, routinely conflated with McKinsey’s figure. McKinsey’s actual number is **$2.6T–$4.4T/yr from generative AI** (*The economic potential of generative AI*, June 2023; [mckinsey.com](https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier)). Use **PwC for $15.7T, McKinsey for $2.6–4.4T** — and don’t imply either is agent‑specific.

---

## 9. What changed since the September 2025 edition

| Topic | Sept 2025 doc | mid‑2026 (this edition) |
|---|---|---|
| Market size | “$7B → $196.6B @ 43.8%” presented as the projection | One of **9 estimates**; full **26%–49.6% CAGR spread** shown; families separated |
| Emergen figure | “$82.7B @ 31.68%” (conservative) | Live page **revised to $52.4B @ 26.0%**; old number stale |
| x402 | “announced May 2025,” qualitative | **Independent foundation**, 1.08M npm dl/mo, 6,217★, 100M+ Base tx (meme‑inflated) |
| ERC‑8004 / 8001 | both “draft” | **8001 Final, 8004 Draft** (canonical repo, Aug 2025) |
| Segment dollar splits | precise $ table | **Dropped as unverifiable**; replaced with sourced 2024 qualitative splits |
| Adoption | “<1% → 33% → 65%” straight line | Same arc **+ counter‑signal**: >40% of agent projects cancelled by 2027; ≤10% per‑function depth |
| $15T impact | implied McKinsey | **Re‑attributed to PwC**; McKinsey = $2.6–4.4T |
| Funding | “a16z/Polychain backing the rails,” qualitative | **Named, sourced rounds** (Kite $18M, Catena $48M+, Nous $50M, Sentient $85M, Story $80M, Skyfire $8.5M) |
| Sentiment | n/a | **Polymarket/Kalshi** prediction‑market odds added |

---

## 10. Provenance, confidence, and how to cite this

- Machine‑readable figures: [`data/provenance.json`](./data/provenance.json) — each entry `{ id, label, value, unit, status, source, method, url, retrieved, tier }`, indexed in [`SOURCES.md`](./SOURCES.md), with firm‑by‑firm market sizes in [`data/market_size.json`](./data/market_size.json), token caps in [`data/ai_agent_tokens.json`](./data/ai_agent_tokens.json), rounds in [`data/funding.json`](./data/funding.json), and scenario formulas in [`data/models.json`](./data/models.json). Built and owned by the Data Acquisition workstream; this report cross‑checks against it and contributed the funding‑round, enterprise‑adoption‑depth, and macro‑attribution figures.
- **[V] = verified** (ledger `status: verified`) from a fetched primary or reputable source on 2026‑06‑30. **[~] = directional** (ledger `snapshot` / `snapshot_pending`) — snippet‑grade, platform‑self‑reported, or the primary page blocked automated retrieval (Gartner, Grand View, Market.us all 403 bots; some Dune/x402scan dashboards are client‑rendered and need an API key). Re‑confirm **[~]** items before quoting as fact.
- **No fabricated numbers.** Where a figure could not be verified (x402 USD volume, a crypto‑AI VC subtotal, exact segment dollar splits), we say so explicitly rather than invent one.

### References (selected, retrieved 2026‑06‑30)

1. x402 — [x402.org](https://www.x402.org/) · [whitepaper](https://www.x402.org/x402-whitepaper.pdf) · repo `api.github.com/repos/x402-foundation/x402` · npm `api.npmjs.org/downloads/point/last-month/x402`
2. x402 adoption / on‑chain — [Chainalysis, 2026‑06‑03](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/) · [The Block](https://www.theblock.co/learn/391983/what-is-coinbases-x402-protocol)
3. L402 — [Lightning Labs docs](https://docs.lightning.engineering/the-lightning-network/l402)
4. ERC‑8004 — [canonical source](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-8004.md) · ERC‑8001 — [canonical source](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-8001.md)
5. Market size — Fortune BI [link](https://www.fortunebusinessinsights.com/ai-agents-market-111574) · Precedence [link](https://www.precedenceresearch.com/ai-agents-market) · Roots [link](https://www.rootsanalysis.com/AI-Agents-Market) · MarketsandMarkets [PRNewswire](https://www.prnewswire.com/news-releases/ai-agents-market-worth-52-62-billion-by-2030---exclusive-report-by-marketsandmarkets-302435486.html) · Grand View [PRNewswire](https://www.prnewswire.com/news-releases/ai-agents-market-size-to-hit-50-31-billion-by-2030-at-cagr-45-8---grand-view-research-inc-302447060.html) · Market.us [scoop mirror](https://scoop.market.us/agentic-ai-market-news/) · Mordor [link](https://www.mordorintelligence.com/industry-reports/agentic-ai-market) · Emergen [link](https://www.emergenresearch.com/industry-report/agentic-artificial-intelligence-market)
6. Adoption — Gartner via [MES](https://www.mescomputing.com/news/ai/5-predictions-about-agentic-ai-from-gartner) & [PAW](https://www.predictiveanalyticsworld.com/machinelearningtimes/gartner-predicts-over-40-of-agentic-ai-projects-will-be-canceled-by-end-of-2027/13875/) · McKinsey via [Forbes](https://www.forbes.com/sites/josipamajic/2026/03/22/10-of-enterprise-functions-use-ai-agents-mckinsey-finds/) · [Deloitte](https://www.deloitte.com/us/en/insights/topics/emerging-technologies/ai-agents-scaling-faster.html)
7. Tokens — [CoinGecko categories API](https://api.coingecko.com/api/v3/coins/categories) · [Bittensor](https://www.coingecko.com/en/coins/bittensor) · [Virtuals (Tiger Research)](https://reports.tiger-research.com/p/virtuals-protocol-acp-eng) · `api.github.com/repos/elizaOS/eliza`
8. Funding — [CB Insights State of AI 2025](https://www.cbinsights.com/research/report/ai-trends-2025/) · Kite [PayPal](https://newsroom.paypal-corp.com/2025-09-02-Kite-Raises-18M-in-Series-A-Funding-To-Enforce-Trust-in-the-Agentic-Web) · Catena [Fortune](https://fortune.com/2026/05/20/catena-labs-series-a-sean-neville-ai-native-bank/) · Nous [Fortune](https://fortune.com/crypto/2025/04/25/paradigm-nous-research-crypto-ai-venture-capital-deepseek-openai-blockchain/) · Sentient [CoinDesk](https://www.coindesk.com/business/2024/07/02/peter-thiels-founders-fund-leads-85m-seed-investment-into-open-source-ai-platform-sentient) · Story [CoinDesk](https://www.coindesk.com/business/2024/08/21/story-protocol-developer-raises-80m-series-b-led-by-a16z-for-intellectual-property-chain) · Skyfire [Finextra](https://www.finextra.com/newsarticle/44621/skyfire-raises-85m-to-bring-autonomous-payments-to-ai-agents)
9. Sentiment — [Polymarket gamma API](https://gamma-api.polymarket.com/events?slug=which-company-has-best-ai-model-end-of-june)
10. Macro — Huang/CES [Fortune](https://fortune.com/2025/01/06/nvidias-jensen-huang-agentics-ai-robots-blackwell-gpu-ces-2025-toyota-autonomous-vehicles/) · McKinsey gen‑AI [link](https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier)

---

*Refreshed 2026‑06‑30 for PRO‑18 (Workstream B / PRO‑20). Replaces the September‑2025 edition. Numbers are stamped to their retrieval date and will drift; re‑pull `[~]` items before republication.*
