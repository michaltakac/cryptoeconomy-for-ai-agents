# QA + Provenance Audit — PRO-18 explorable essay (Workstream E3 / PRO-25)

**Auditor:** QA Specialist · **Date:** 2026-06-30 · **Scope:** `index.html`, `app.js`, `data/*.json`, `SOURCES.md`
**Artifacts under test:** commit `1a8dfbb` (site) + `6365467` (token_traction model def)
**Method:** static read of every rendered figure against `data/provenance.json` / `SOURCES.md`; numeric re-computation of all six model formulas; design + resilience review by code inspection.

Verdict: **CONDITIONAL PASS — 2 blockers + 2 medium fixes required before publish (PRO-26).** Five of six modules are genuinely explorable, design + resilience pass, and the core measured numbers all tie to the ledger. The defects below are filed to the implementation owner.

---

## 1. Success-criteria scorecard (PRO-18 §2)

| Criterion | Result | Notes |
|---|---|---|
| Provenance: every rendered number → ledger entry (value+URL+date) | ⚠️ **1 gap** | elizaOS "$4M" has no `provenance.json`/`SOURCES.md` entry (F2). All other rendered figures tie out. |
| Modeled numbers labelled *modeled* + formula | ✅ | M1/M3/M5/M6 carry "your scenario / modeled" + formulas trace to `models.json`. |
| Explorable, not static (manipulable input + live output per module) | ⚠️ **1 of 6 fails** | M4 ships as a read-only "blocked" stub (F1). M1,M2,M3,M5,M6 interactive ✅. |
| Design: light beige/black, responsive, no clutter | ✅ | `--paper #f4efe1` / `--ink #1a1a17`; `@640px` + `pointer:coarse` + `prefers-reduced-motion`; single 38rem column. |
| Resilience: API-down → fallback to `/data`, no blanks/errors | ✅ | `boot()` try/catch surfaces an honesty notice; M3 live npm has 3s `AbortController` + snapshot fallback. |
| Link / citation check | ✅ | Footer links `data/provenance.json`, `market-research.md`, `SOURCES.md` — all present. |
| Plain-language / jargon check | ✅ | CAGR, x402, "HTTP 402" each defined inline at first use. |

## 2. Numeric re-computation (model outputs sane & traceable)

| Module | Formula source | Default output (recomputed) | Backing |
|---|---|---|---|
| M1 cagr_projection | `models.json#cagr_projection` | 2034 → **$211B**; firm spread $64B→$301B (4.7×) | `market_size.json` (9 firms), `cagr-spread` |
| M2 segment_reweight | `#segment_reweight` | crypto slice **$0.19B / 2.4%** of $8.03B | `legacy_segment_split` (flagged) |
| M3 x402_adoption | `#x402_adoption` | **$100M/yr** modeled; anchor npm 1,076,390/mo | `npm-x402` ✅ |
| M4 token_traction | `#token_traction` | **not rendered (stub)** | — (F1) |
| M5 enterprise_scurve | `#enterprise_scurve` | **59% by 2030**, 40% at 2028 | legacy anchors (F3) |
| M6 build_your_future | `#build_your_future` | **$49B in 2030**, eff CAGR 43.8% | `fortune-2025-base`, `cagr-spread` |

Spot-checks that tie out: x402 npm **1.08M/mo** = `npm-x402` (1,076,390) ✅ · elizaOS installs **82,600** = `npm-elizaos` (82,593) ✅ · TAO **$1.95B** = `tao-mcap` (1,946,350,563) ✅ · cancellations **>40%** = `gartner-cancel-2027` ✅ · per-function depth **≤10%** = `mckinsey-scaling-agents` ✅ · CAGR spread **26.0–49.6%, n=9** = `market_size.json` ✅.

---

## 3. Findings (filed to implementation owner)

### F1 — BLOCKER · M4 "Price ≠ traction" is a static read-only stub
`app.js` `buildM4()` renders a `badge("blocked · model def pending")` placeholder with no slider/toggle and no live output, violating the "explorable, not static — reject read-only charts" criterion (1 of 6 modules).
**Root cause is stale:** the stub text says it is "waiting on the `token_traction` model definition committed to `data/models.json`" — **that dependency has landed.** `data/models.json:83-94` fully defines `token_traction` (rank_metric lens + hype_discount slider, formula `implied_value = market_cap / max(traction,1)`, data_refs `ai_agent_tokens.json` / `x402_adoption.json` / `bittensor.json`), committed in `6365467` (PRO-28) *after* the site (`1a8dfbb`).
**Fix:** implement M4 against `models.json#token_traction` — a re-rankable list (lens toggle: market cap / npm downloads / GitHub stars) + `hype_discount` slider, rows from the committed token data, missing metric shown `n/a` (never zero-filled).

### F2 — BLOCKER · Unsourced rendered figure: elizaOS "about $4M"
`index.html:243` (Act IV) renders elizaOS token value **"about $4M"**. There is **no entry** for an elizaOS/ai16z market cap in `data/provenance.json` or `SOURCES.md` (no value+URL+retrieval date), and **no row** in `data/ai_agent_tokens.json`. It is mentioned only in `market-research.md:135` (~$3.96M, itself uncited inline). This fails the hard rule "every rendered number ties to an entry in `data/provenance.json`/`SOURCES.md`."
**Fix:** add a sourced live/snapshot ledger entry for the elizaOS (ex-ai16z, symbol ELIZAOS) market cap via CoinGecko `coins/markets` + a row in `ai_agent_tokens.json`, **or** remove the "$4M" figure and keep the qualitative claim. Do not ship the bare number.

### F3 — MEDIUM · M5 anchors use superseded legacy sources; "re-source before publish" banner is now stale
`models.json#enterprise_scurve.real_anchors` still reference `gartner-adoption-2025` / `gartner-adoption-2028` (`legacy_unverified`), and `app.js` `buildM5()` shows a persistent "LEGACY — RE-SOURCE" banner. **PRO-20 already committed verified replacements** that `supersede` them: `gartner-share-2028-verified` (share_2024 0.01, share_2028 0.33), `gartner-cancel-2027`, `mckinsey-scaling-agents`. The footer claim that "the adoption anchors ship on flagged, unverified defaults by design" is now inaccurate.
**Fix:** re-point the anchors to the verified ids, correct the lower anchor year **2025 → 2024** (verified is `share_2024`), and soften/remove the legacy banner + footer caveat.

### F4 — MEDIUM · Prose/data year mismatch
`index.html:262` states enterprise use "climbs from under 1% in **2025**". The verified source (`gartner-share-2028-verified`) reports **<1% in 2024**. Align prose (and the F3 anchor) to 2024.

### F5 — LOW/NOTE · Snapshot-timing drift between ledger and token snapshot
`provenance.json` `cg-ai-agents-mcap` = 2,785,414,786 vs `ai_agent_tokens.json` total 2,795,027,591; Venice 595,279,907 vs 596,739,812 (~0.3%). Both are live snapshots captured minutes apart and are not rendered side-by-side, so not reader-visible — flag only for a single consistent re-fetch at publish.

### F6 — LOW/NOTE · Generic `file://` text in `boot()` failure fallback
`app.js:478` shows a `file://` same-origin explanation for *any* data-load failure, including genuine network errors. Cosmetic; resilience behaviour (no blank/crash) is correct.

---

## 4. Re-verification plan (QA sign-off gate before PRO-26 publish)

PRO-25 stays **blocked** by the fix issue. On `issue_blockers_resolved`, re-run:
1. M4 renders an interactive control + live re-ranked output (no "blocked" badge).
2. `grep` confirms every rendered figure (incl. elizaOS) resolves to a `provenance.json`/`SOURCES.md` id with URL + date.
3. M5 anchors cite verified ids; no "re-source before publish" banner; 2024 lower anchor.
4. Footer caveats match the shipped state.
Then mark PRO-25 `done` to release PRO-26.
