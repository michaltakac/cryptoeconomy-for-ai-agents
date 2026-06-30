# PRD — `index.html` Explorable Essay (interaction + data contract)

> **Workstream E1 of [PRO-18](/PRO/issues/PRO-18) ([PRO-23](/PRO/issues/PRO-23)).** Implements approved plan §6 (essay/site) + §3 (tech).
> **Status:** build-ready spec. **Owner:** Product Execution (VP). **Support:** PRD Writer.
> **Unblocked by:** module set locked at 6 in [`docs/essay-thesis-and-modules.md`](./essay-thesis-and-modules.md) (PRO-21, §3). This PRD is the *implementation contract* for that module set.
> **Consumes:** #1's `data/*.json` (locked 2026-06-30) + `data/models.json` + `data/sources.json`/`provenance.json`.
> **Date:** 2026-06-30. Invents no numbers; every binding traces to a committed `data/` key.

---

## 0. Scope & non-goals

**In scope:** a single static `index.html` deployed on GitHub Pages that renders the 6 locked explorable modules (M1–M6), each binding a manipulable input to a live output, against the committed data layer with live-API enrichment where CORS allows.

**Out of scope:** new data acquisition (owned by #1); copywriting of the long-form essay prose (owned by the essay/Strategy workstream — this PRD specifies the *interactive* shells the prose wraps); the one open model-def dependency `token_traction` for M4 (see §6 — must land in `models.json` before M4 wiring).

**Definition of done (per module):** ships a **manipulable input + a live recomputed output** (QA-fail otherwise), binds only to keys that **exist in `data/`**, and degrades gracefully to the committed snapshot when a live API is unreachable (§5).

---

## 1. Tech decisions (plan §3)

| Decision | Choice | Rationale |
|---|---|---|
| **Build step** | **None.** Hand-authored `index.html` + ES modules served as static files. | GitHub Pages serves static files only; no CI bundler. Plain `<script type="module">`. |
| **Framework** | **Vanilla JS.** No React/Vue/Svelte. | Zero build, smallest payload, no hydration. State held in plain objects + event listeners. |
| **Charting** | **D3 v7** (default) via CDN ESM. Observable Plot or Chart.js acceptable per-module where they're materially simpler (e.g. Plot for M2 treemap, Chart.js for M5 line). | Plan §3 names D3 default; Plot/Chart.js acceptable. D3 covers scales/drag/transitions for the slider-driven curves. |
| **CDN delivery** | ESM imports pinned to a version, with [SRI](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity) where the CDN exposes a hash. e.g. `import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"`. | No `node_modules`, no lockfile; pin the major to avoid surprise breaks. |
| **Data load** | `fetch('./data/<file>.json')` at view time (same-origin on Pages — always works). Live API enrichment layered on top with timeout + fallback (§5). | Snapshot is the floor; live is the bonus. |
| **Styling** | Single inline `<style>` or one `styles.css`. System font stack, CSS custom properties for the scenario/your-value accent. No CSS framework. | Keep it one file + assets; no build. |
| **Math** | All formulas inline in JS, mirroring `models.json` formula strings exactly (§3 per-module). No math library needed beyond `Math`. | Auditability: each module's compute fn is a 1:1 transcription of its `models.json#<id>.formula`. |
| **Browser target** | Evergreen Chrome/Firefox/Safari/Edge. ES2020, `fetch`, `AbortController`, CSS grid. No IE/legacy. | 2026 baseline. |
| **Accessibility** | Every slider is a native `<input type="range">` with `aria-label` + a visible numeric readout; drag interactions (M2 treemap) provide a keyboard/number-input fallback. | Sliders must be operable without a mouse. |

**File layout (repo root → Pages):**
```
index.html            ← the essay + all 6 module shells
app.js                ← module registry, data loader, fallback orchestration
modules/m1..m6.js     ← one compute+render module each (or one app.js if small)
data/*.json           ← committed snapshots (owned by #1, do not edit here)
styles.css            ← optional; inline <style> acceptable
```

---

## 2. Shared architecture & data-binding contract

### 2.1 Load order (every view)
1. `fetch` all required `./data/*.json` snapshots in parallel (`Promise.all`). These are same-origin on Pages → **cannot fail under normal serve**; they are the guaranteed floor.
2. Render every module immediately from the snapshot. **The page is fully interactive before any external network call.**
3. For each module with a live source (§5 map), fire a CORS `fetch` to the live API **with a 3 s `AbortController` timeout**. On success, swap the live value in and stamp a "live · <time>" badge. On failure/timeout, keep the snapshot and stamp a "snapshot · <date>" badge. **No blanks, no errors, no spinners that never resolve.**

### 2.2 Binding contract (the part #1 cares about)
- Each module declares a `dataRefs: string[]` (snapshot files) and reads **named keys** from them. The exact key paths are enumerated per module in §3. If a key named here is absent from the committed JSON, that is a **contract break** → file against #1, do not invent a value.
- Each module's compute function references its `models.json` model by `id` and transcribes the `formula` verbatim. Input bounds (`min`/`max`/`step`/`default`/`scale`) are read from `models.json#<id>.inputs` — **the UI must not hard-code bounds that diverge from `models.json`.**
- Outputs are labelled per `models.json#<id>.label` (`"modeled"` / `"your scenario"`). Modeled outputs are never presented as measured fact.

### 2.3 State model
Plain per-module state object `{ inputs, derived }`. Slider `input` event → recompute `derived` synchronously (all formulas are O(1) or O(firms)) → re-render that module only. No global store, no framework reconciliation.

---

## 3. Per-module interaction + data-binding spec

> Format per module: **Model** (`models.json` id) · **Inputs** (control type → param, bounds from `models.json`) · **Live output** · **Data bindings** (file → key path) · **Live/snapshot** (→ §5) · **Build requirements / honesty flags**.

### M1 — Market-size scenario dial
- **Model:** `models.json#cagr_projection`. Formula: `value(t) = base_value * (1 + cagr)^(t − base_year)`.
- **Inputs:**
  - slider → `base_value` [5.0 – 15.0] USD_B, default 8.03
  - segmented toggle → `base_year` ∈ {2024, 2025, 2026}, default 2025
  - slider → `cagr` [0.26 – 0.496], step 0.001, default 0.438 *(bounds = real firm spread; label the ends "Emergen 26.0%" / "Grand View 49.6%")*
  - slider → `horizon_year` [2030 – 2035], default 2034
- **Live output:** the reader's projected value at `horizon_year`, drawn as a "your scenario" curve **overlaid on static reference bands** — one published curve per firm.
- **Data bindings:**
  - `market_size.json` → `firms[]` each `{firm, report, base_year, base_usd_b, forecast_year, forecast_usd_b, cagr_pct, url}` → plot each firm's base→forecast reference curve.
  - `market_size.json` → `cagr_spread_pct` → annotate the slider track ends.
  - `models.json#cagr_projection.inputs` → all slider bounds/defaults.
- **Live/snapshot:** **snapshot-only** (`market-research-firms`, no CORS). No live call. Badge: "research-firm figures · 2026-06-15".
- **Build req:** the swing readout must surface the headline insight — show the 2034 value at both CAGR extremes (~$52B → ~$295B) as the reader drags. **No QA risk.**

### M2 — Re-weightable segment treemap
- **Model:** `models.json#segment_reweight`. Formula: `segment_value_i = total_market * weight_i`, `sum(weight_i)=1` (renormalize on drag).
- **Inputs:** drag tile edges (or a number `<input>` fallback per segment) → `weights{}`; auto-renormalize remaining tiles to keep the sum at 1, on a `total_market` base (default 8.03).
- **Live output:** implied USD per segment, recomputed live as tiles resize.
- **Data bindings:**
  - `models.json#segment_reweight.inputs.weights.default` → `{algorithmic_trading 0.337, ai_call_centers 0.30, supply_chain 0.257, crypto_agents 0.024, other 0.082}`.
  - `models.json#segment_reweight.inputs.total_market` → 8.03 USD_B.
- **Live/snapshot:** **snapshot-only** (derived from `models.json` + `market_size` base). No live call.
- **Build req / honesty flag (mandatory):** default weights are **LEGACY/unverified** (Sept-2025 split, flagged in `provenance.json`). Tiles **must render a persistent visible label**: *"unverified default split — drag to test your own."* The module's point is "don't trust the default," so shipping the default unlabeled is a **QA-fail**.

### M3 — x402 adoption simulator
- **Model:** `models.json#x402_adoption`. Formula: `sim_volume = api_calls_per_year * pay_per_call_share * avg_price_usd`.
- **Inputs:**
  - slider (log) → `api_calls_per_year` [1e9 – 1e13], default 1e12
  - slider → `pay_per_call_share` [0 – 1], step 0.005, default 0.01
  - slider (log) → `avg_price_usd` [0.001 – 1.00], default 0.01
- **Live output:** simulated annual micropayment volume, shown **against the real adoption anchor** — the live x402 npm-downloads proxy (≈1.08M/mo).
- **Data bindings:**
  - `x402_adoption.json` → `npm_downloads_last_month[]` (`package`, `downloads`, `window`, `tier`, `cors`) → real adoption proxy; feature `x402` (1,076,390) and `@coinbase/x402`, `@elizaos/core`.
  - `x402_adoption.json` → `x402_onchain_volume` (`value:null`, `status:"snapshot_pending_key"`) → render as "on-chain $ volume: pending Dune key" — **do not fabricate**; show the npm proxy as the live signal until stamped.
  - `models.json#x402_adoption.inputs` → slider bounds/scales.
- **Live/snapshot:** **live npm** (`https://api.npmjs.org/downloads/point/last-month/x402`, CORS `*`, 3 s timeout) → fall back to snapshot `npm_downloads_last_month`. On-chain volume is **snapshot/pending** (Dune, no CORS, no key) — never blank, label it pending.
- **Build req:** the sim output is explicitly a what-if ("modeled"); the npm proxy is the only thing presented as real. **No QA risk.**

### M4 — Token-vs-traction explorer  🟡 *needs `token_traction` model def first (§6)*
- **Model:** `models.json#token_traction` — **NOT YET PRESENT** (open dependency, §6). Until #1 stamps it, M4 is **build-blocked**; ship M1–M3, M5–M6 without it and wire M4 when the def lands.
- **Inputs:**
  - toggle → `rank_metric` ∈ {`market_cap_usd`, `npm_downloads_month`, `github_stars`}, default `market_cap_usd`
  - slider → `hype_discount` [0 – 1], step 0.05, default 0 (haircut applied to token cap)
- **Live output:** side-by-side re-rank of tokens under the chosen lens — e.g. elizaOS sinks on market cap (~$4M) but rises on npm traction (82.6k/mo); Bittensor/Virtuals reposition. `implied_value = market_cap_usd / max(traction_metric, 1)`.
- **Data bindings:**
  - `ai_agent_tokens.json` → `tokens[]` (`symbol`, `name`, `market_cap`, `current_price`, `market_cap_rank`) and `category_totals{}`.
  - `bittensor.json` → `tao_token` (`market_cap_usd` 1,946,350,563, `price_usd`, `tier:"live"`).
  - `x402_adoption.json` → `npm_downloads_last_month[]` (`@elizaos/core` 82,593) as the traction proxy; `github_repos` for the stars lens.
  - `models.json#token_traction.inputs` → control bounds *(once added)*.
- **Live/snapshot:** **live CoinGecko** for token caps (`https://api.coingecko.com/api/v3/coins/markets?...category=ai-agents`, CORS `*`, 3 s timeout) → fall back to `ai_agent_tokens.json`. **Live npm** for traction → fall back to snapshot. **Live GitHub** for stars → fall back to `x402_adoption.json#github_repos`.
- **Build req:** the decoupling story is the insight; ensure the toggle visibly re-orders rows (animated re-rank), not just relabels. **Blocked until §6 lands.**

### M5 — Enterprise-adoption S-curve
- **Model:** `models.json#enterprise_scurve`. Formula: `adoption(t) = ceiling / (1 + exp(−k*(t − inflection_year)))`.
- **Inputs:**
  - slider → `ceiling` [0.2 – 1.0], default 0.65
  - slider → `k` (steepness) [0.2 – 2.0], default 0.9
  - slider → `inflection_year` [2026 – 2032], default 2027.5
- **Live output:** logistic curve drawn through the real anchors, reader's curve overlaid.
- **Data bindings:**
  - `models.json#enterprise_scurve.real_anchors` → `[{2025: 0.01, src gartner-adoption-2025}, {2028: 0.33, src gartner-adoption-2028}]` → plotted anchor points.
  - `models.json#enterprise_scurve.inputs` → slider bounds.
- **Live/snapshot:** **snapshot-only** (Gartner anchors, no live feed). No live call.
- **Build req / honesty flag (mandatory):** anchors are **LEGACY claims — re-source before publish** (per `provenance.json`). Each anchor point **must render its source ref + a "LEGACY — re-source" flag**. Present **attrition**, not a clean line to 65%: annotate the >40% project-cancellation / ≤10% per-function depth caveat near the ceiling slider. Shipping a triumphant straight line is a **QA-fail**.

### M6 — Build-your-future composite what-if
- **Model:** `models.json#build_your_future`. Formula: `value(2030) = base_value*(1+effective_cagr)^(2030−base_year)`, `effective_cagr = base_cagr * adoption_speed * (1−regulation_drag) * (1+micropayment_boost)`, **clamped to [0.26, 0.55]**.
- **Inputs:**
  - slider → `adoption_speed` [0.5 – 1.5], default 1.0
  - slider → `regulation_drag` [0 – 0.4], default 0
  - slider → `micropayment_boost` [0 – 0.3], default 0
- **Live output:** narrated 2030 sentence — *"Under your assumptions the agent economy is ~$X B in 2030"* — the essay's closing replay-your-settings move.
- **Data bindings:**
  - `models.json#build_your_future.inputs` → `base_value` 8.03, `base_cagr` 0.438, `base_year` 2025 + the three reader levers.
- **Live/snapshot:** **snapshot-only.** No live call.
- **Build req:** label output "your scenario / modeled"; enforce the `effective_cagr` clamp so the reader can't exit the real evidence envelope. **No QA risk.**

---

## 4. Module → data-key index (the contract #1 must keep stable)

| Module | `models.json` id | Snapshot files (keys) | Live API (CORS) |
|---|---|---|---|
| M1 | `cagr_projection` | `market_size.json` → `firms[]`, `cagr_spread_pct` | none |
| M2 | `segment_reweight` | `models.json#segment_reweight.inputs` (weights, total_market) | none |
| M3 | `x402_adoption` | `x402_adoption.json` → `npm_downloads_last_month[]`, `x402_onchain_volume` | npm (live) |
| M4 | `token_traction` ⚠️*pending §6* | `ai_agent_tokens.json` → `tokens[]`,`category_totals`; `bittensor.json` → `tao_token`; `x402_adoption.json` → `npm_downloads_last_month[]`,`github_repos` | CoinGecko, npm, GitHub (live) |
| M5 | `enterprise_scurve` | `models.json#enterprise_scurve.real_anchors` | none |
| M6 | `build_your_future` | `models.json#build_your_future.inputs` | none |

---

## 5. Live-vs-snapshot data-source map + graceful degradation

**Rule (plan §3):** the committed snapshot is the **floor** and renders first; a live CORS API is **enrichment** fetched with a 3 s `AbortController` timeout. On any failure (timeout, non-2xx, CORS reject, malformed JSON) the snapshot stays and the badge reads "snapshot · <date>". **Never a blank, never a thrown error in the UI.**

| Source (`sources.json` id) | Tier | CORS | Live endpoint | Snapshot fallback | Used by |
|---|---|---|---|---|---|
| `coingecko` | live | `*` | `api.coingecko.com/api/v3/coins/markets?…category=ai-agents` | `ai_agent_tokens.json` | M4 |
| `npm` | live | `*` | `api.npmjs.org/downloads/point/last-month/{pkg}` | `x402_adoption.json#npm_downloads_last_month` | M3, M4 |
| `github` | live | `*` | `api.github.com/repos/{owner}/{repo}` | `x402_adoption.json#github_repos` | M4 |
| `defillama` | live | `*` | `api.llama.fi/protocols` | `onchain.json` | *(reserved; not bound by M1–M6)* |
| `dune` (x402 on-chain $) | snapshot | **none** | — (needs API key) | `x402_adoption.json#x402_onchain_volume` (`status: pending_key`) | M3 (shown as "pending") |
| `taostats` | snapshot | none | — | `bittensor.json` (already live-sourced via CoinGecko) | M4 |
| `market-research-firms` | snapshot | none | — | `market_size.json` | M1 |
| Gartner adoption anchors | snapshot | none | — | `models.json#enterprise_scurve.real_anchors` | M5 |

**Degradation behavior, concretely:**
- **Snapshot-only modules (M1, M2, M5, M6):** no network beyond the same-origin `data/` fetch; cannot degrade. Badge: "snapshot · 2026-06-30".
- **Live-enriched modules (M3, M4):** render snapshot instantly; attempt live; on success badge "live · HH:MM", on failure badge "snapshot · 2026-06-30". A failed live call is invisible to the reader except for the badge.
- **CoinGecko 429 (keyless throttle):** treat as failure → snapshot. (Optional: one retry after 1 s, then give up.)
- **x402 on-chain $ volume (Dune):** structurally unavailable (no CORS, no key) → always rendered as "on-chain $ volume — pending Dune key", never a zero or blank.

---

## 6. Open dependency (build-blocking for M4 only)

`models.json` currently has **5 of 6** model defs. **M4's `token_traction` def is missing** — recommended JSON spec already drafted in [`docs/essay-thesis-and-modules.md` §5](./essay-thesis-and-modules.md). Until it is committed to `data/models.json`, **M4 cannot be wired**; the other five modules are fully specified and buildable against this PRD as-is.

- **Owner of the fix:** Data Acquisition / #1 (owns `models.json`). Action: append the `token_traction` object from §5 of the thesis doc.
- **Until then:** ship `index.html` with M1, M2, M3, M5, M6 live; M4 stubbed with a "coming — pending model def" placeholder (which itself must not show a blank/error).

---

## 7. QA acceptance checklist (per module, before publish)

1. ☐ Has a **manipulable input** (slider/drag/toggle) that visibly changes a **live output** on interaction (the §3 QA-fail rule).
2. ☐ Every rendered datapoint maps to a **real key in `data/`** (§4); no invented numbers.
3. ☐ Input bounds/defaults match `models.json#<id>.inputs` exactly (no UI-only divergence).
4. ☐ Compute fn is a 1:1 transcription of `models.json#<id>.formula`.
5. ☐ Output labelled "modeled / your scenario" where `models.json.label` says so.
6. ☐ **Honesty flags rendered in-UI:** M2 "unverified default split" label; M5 anchor source + "LEGACY — re-source" + attrition caveat.
7. ☐ Graceful degradation verified: kill the network → page still renders from snapshot, badge flips to "snapshot", no blank/error (M3, M4).
8. ☐ Keyboard-operable: every slider reachable + adjustable without a mouse; M2 has a number-input fallback.
9. ☐ Loads with **no build step** — open `index.html` over `file://` *and* via Pages and it works (same-origin `data/` fetch requires serving over http; document that `file://` may block fetch, so test on Pages or a local static server).

---

## 8. Handoff & disposition

- **This PRD is the build contract** for the `index.html` site-build workstream. It binds each of the 6 locked modules to its `models.json` formula, its `data/` keys, and its live/snapshot source, with concrete degradation behavior and a per-module QA gate.
- **One build-blocking dependency** (M4 `token_traction`, §6) is owned by #1; M1–M3, M5–M6 are unblocked and buildable now.
- **No data invented.** M2 and M5 ship on LEGACY-flagged defaults **by design** — the build must surface the flag in-UI (§3, §7.6).

*Authored 2026-06-30 for PRO-18 Workstream E1 (PRO-23). Consumes #1 `data/` + PRO-21 module lock. PRD Writer support.*
