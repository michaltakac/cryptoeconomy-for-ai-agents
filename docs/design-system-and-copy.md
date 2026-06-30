# Explorable-Essay Design System + Copy Deck

> **Workstream D of [PRO-18](/PRO/issues/PRO-18)** — approved plan §2 (design) and §6 (essay/site).
> **Status:** build contract for look-and-feel + all reader-facing words. **Owner:** Marketing & Growth (Director).
> **Unblocked by** Workstream C — [`essay-thesis-and-modules.md`](./essay-thesis-and-modules.md) (PRO-21): thesis locked, 6 modules locked (M1–M6).
> **Editor:** loop in for proofing before publish (see §0 sign-off).
> **Date:** 2026-06-30. Every figure quoted in copy traces to [`data/provenance.json`](../data/provenance.json); this doc invents no numbers.

---

## 0. How to use this document

Two halves, one contract:

- **Part A — Design system** (§1–§7): the visual language the site-build workstream implements. Tokens, type, layout, motion, components, responsive, accessibility.
- **Part B — Copy deck** (§8–§16): every word the reader sees — section prose, the one-sentence jargon intros, and the inline commentary that frames each interactive.

**The governing rule (from the plan, §6): _manipulation precedes explanation_.** The reader meets a control, moves it, *then* reads what it means. Copy is written to sit **after the first nudge**, not before it. Every interactive answers a question the prose has just put in the reader's head.

**Sign-off gates before publish:**
1. **Editor proof** of Part B (voice, jargon, accessibility phrasing).
2. **Honesty-flag check** — M2 and M5 ship on LEGACY/unverified defaults *by design*; their copy must say so in-UI (§10, §13).
3. **Data trace** — every number in copy matches `data/provenance.json`.

---

# PART A — DESIGN SYSTEM

## 1. Design intent

A quiet, reading-first document that happens to be interactive. The model is the **printed essay**, not the dashboard. Reference studies (from the brief): Bret Victor's *Explorable Explanations*, *"What can a Technologist do about Climate Change?"*, and *Kill Math* — long single-column prose where interactives are **inline figures the reader can touch**, set in wide margins of whitespace, with no chrome competing for attention.

**Explicit anti-patterns** (what the old `market-graphs.html` did and we do not):
- ❌ Purple `linear-gradient(135deg, #667eea → #764ba2)` hero and headers.
- ❌ White cards floating on `box-shadow: 0 10px 30px`.
- ❌ Dashboard grid of equal-weight tiles.
- ❌ Decorative color used to signal "data viz energy."

We replace all of it with ink-on-paper.

---

## 2. Color tokens

Restrained, warm-paper palette. Black text on light beige. Color is **functional only** — it marks the reader's own input versus the cited reference, never decoration.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f4efe1` | Page background (beige family, per brief) |
| `--paper-sunk` | `#ece5d3` | Inset interactive "stage" area, subtly recessed (no shadow) |
| `--ink` | `#1a1a17` | Body text, near-black warm |
| `--ink-soft` | `#55504420` → text `#6b655a` | Captions, axis labels, secondary text |
| `--rule` | `#d8cfb8` | Hairline rules, axis lines, tile borders |
| `--reader` | `#1a1a17` | **The reader's own line/value** — solid black, the protagonist |
| `--reference` | `#9b8b66` | Cited reference curves/bands (firm forecasts, real anchors) — muted, recede behind the reader's mark |
| `--accent-warn` | `#a8541f` | Honesty flags only ("unverified — drag to test"), used sparingly |
| `--link` | `#7a4a12` underline | Inline citation links |

**Rules**
- Exactly **one** saturated accent (`--accent-warn`) and it is reserved for honesty/uncertainty, never for "this is important."
- No gradients anywhere. No drop shadows; depth comes from the `--paper-sunk` inset and hairline `--rule`, not blur.
- Contrast: `--ink` on `--paper` ≈ 13:1; `--ink-soft` text on `--paper` ≥ 4.6:1 (AA). `--reference` lines carry a non-color label so they never rely on hue alone.

---

## 3. Typography

A clean typographic essay. Serif for reading, with one humanist mono for numbers so figures align and read as "instrument output."

| Role | Family | Size (desktop) | Notes |
|---|---|---|---|
| Body | Serif — *Source Serif 4* / *Iowan* / Georgia fallback | 20px / 1.65 | Reading column |
| H1 (title) | Same serif, regular weight | 44px / 1.15 | No bold-black hero; weight comes from size + space |
| H2 (act headers) | Serif | 30px | Roman numerals for the six acts (I–VI) |
| H3 (module label) | Sans — *Inter* / system-ui | 15px, tracked `+0.06em`, uppercase | Quiet "figure" tag above each interactive |
| Caption / axis | Sans | 14px | `--ink-soft` |
| Numeric readouts | Mono — *IBM Plex Mono* / ui-monospace | 16–28px | Live output values, so digits don't reflow |
| Pull-quote (thesis) | Serif italic | 26px | One per essay; the "spread is the finding" line |

**Measure:** body column max `38rem` (~68 chars). Interactives may break out to `52rem` ("figure breakout") but prose never exceeds the reading measure.

**Vertical rhythm:** baseline ~`1.65rem`; section gaps `4–6rem` — generous whitespace is a feature, not slack.

---

## 4. Layout

Single centered column. Three width tiers:

```
│        reading measure (38rem)        │   ← prose
│            figure breakout (52rem)            │   ← interactive stage
│  full-bleed margin note  →                    │   ← optional side commentary (desktop ≥1100px)
```

- **Prose** sits in the reading measure, centered.
- **Each interactive** lives in a `--paper-sunk` inset block (the "stage"), breaking out wider, with its `H3` figure-label top-left and live numeric readout top-right.
- **Inline commentary** (the "what you just did" text, §8) sits *below* its interactive in the reading measure. On wide screens, short framing notes may float in the right margin as **margin notes** (Tufte-style); on narrow screens they collapse inline.
- Scroll order **is** the argument arc (acts I→VI). No tabs, no nav that lets the reader skip the build-up — but a thin progress rule pins the six act-markers for orientation.

---

## 5. Motion

Restrained, in service of cause-and-effect — never ambient.

- Output responds to input within **one frame** (no eased "count-up" animation that hides the live link between control and result).
- Transitions only on **state the reader didn't cause** (e.g. a reference band fading in on scroll): `200ms ease-out`, opacity/transform only.
- **No** parallax, no auto-playing anything, no scroll-jacking.
- Sliders/handles: 120ms tactile press feedback, that's all.
- **Respect `prefers-reduced-motion`**: disable all scroll-triggered transitions; interactives still fully work (they're input-driven, not animation-driven).

---

## 6. Component kit

| Component | Behaviour | Notes |
|---|---|---|
| **Slider** | Native `<input type=range>` restyled; black handle on `--rule` track; live value in mono to its right | Labelled; keyboard-steppable; `aria-valuetext` carries the human-readable value (e.g. "43.6% — Fortune BI") |
| **Toggle / segmented** | Text segments (e.g. *Rank by cap | by downloads*), black underline marks active | For M4 lens switch |
| **Draggable tile (treemap)** | Pointer-drag to resize weight; tiles auto-renormalise | M2; each tile shows label + live USD + the unverified flag |
| **Reference band/curve** | `--reference` muted line, always carries a text label + source | The cited firms / real anchors; recedes behind reader's black mark |
| **Reader mark** | Solid `--ink` line/dot — "your scenario" | Always visually dominant over references |
| **Readout** | Mono numeric, top-right of stage | Updates live; the "answer" |
| **Honesty flag** | `--accent-warn` small-caps tag + tooltip | M2, M5 only; non-dismissable |
| **Citation link** | Inline underline → `data/` source / provenance row | Every figure is traceable |

All controls have visible focus rings (`2px --ink` outline, never `outline:none`).

---

## 7. Responsive

Mobile-first; the essay must read like an essay on a phone.

- **≤640px:** single column at reading measure = viewport minus 1.25rem gutters; body 18px. Interactive stages stack control-above-output; margin notes collapse inline. Treemap tiles become a draggable vertical list with the same renormalise behaviour (drag is not lost on touch).
- **641–1100px:** figure breakout active; margin notes still inline.
- **≥1100px:** full layout with right-margin notes.
- Touch targets ≥44px. Sliders get larger handles on coarse pointers (`@media (pointer:coarse)`).
- All interactives degrade to a readable static state if JS fails: server-render the default scenario as a labelled figure so the prose still makes sense.

---

# PART B — COPY DECK

## 8. Voice & tone

- **Concise, professional, plain.** Short sentences. No hype adjectives ("revolutionary," "explosive"), no breathless futures.
- **No unexplained jargon.** `x402`, `ERC-8004`, `TAO` (and any other term of art) get **one plain sentence on first use** (§9), then may be used bare.
- **Second person at the interactives** ("Drag the CAGR…", "You just…") because the reader's action is the argument.
- **The number is never "the" number.** Copy always frames figures as one choice in a range; the spread is the finding.
- **Honesty out loud.** Where a default is unverified or legacy, the copy says so plainly rather than hiding it.

---

## 9. Plain-language glossary (one sentence, on first use)

These sentences ship **inline at first mention** (and as hover/footnote definitions on later mentions). Editor: please proof for accuracy + plainness.

- **x402** — a way for software to pay for a single web request on the spot, by answering an "HTTP 402 Payment Required" response with a small stablecoin payment — no account or subscription.
- **ERC-8004** ("Trustless Agents") — a draft Ethereum standard for letting independent AI agents find each other and prove they can be trusted before they transact.
- **ERC-8001** ("Agent Coordination") — a finalised Ethereum standard for how multiple agents agree on and record a shared action on-chain.
- **TAO** — the token of Bittensor, a network that pays contributors for useful machine-learning work done by its "subnets."
- **CAGR** — compound annual growth rate: the single yearly percentage a market would have to grow at, every year, to reach a forecast.
- **Stablecoin** — a crypto token pegged to a normal currency (usually one token ≈ one US dollar), used here as the unit agents pay in.
- **npm downloads** — how many times developers installed a piece of software in a month; used here as a real, countable proxy for "are people actually building on this?"
- **L402 / Lightning** — an older pay-per-request method that settles in Bitcoin over the Lightning network, mentioned only as the precursor to x402.

---

## 10. Title + opening (pre-Act)

**Title (H1):**
> Two economies, one name

**Standfirst (deck):**
> "The AI-agent economy" is quoted as a single number. It isn't one. It's a large, loosely-defined software market sitting next to a small, cooled, crypto-native slice — and most coverage blurs them into one headline. This essay hands you the dials behind that headline. Move them, and watch which economy you were actually betting on.

**Opening prose (reading measure):**
> Search "AI agent market size" and you'll get a confident figure. Search again and you'll get a different one — off by five or six times. They're not contradicting each other so much as quietly disagreeing about what counts. Before we explain why, we'll let you do the thing every forecast does behind closed doors: pick the assumptions.

*(Inline note, margin):* Every interactive here is driven by data in this repo's `data/` folder. Where a default is uncertain, we say so on the figure itself.

---

## 11. Act I — "The headline is a mirage" · Module M1

**H3 figure-label:** `MARKET-SIZE SCENARIO DIAL`

**Lead-in (before the control — one line only, manipulation precedes explanation):**
> Here's the number you've probably seen. Now drag it.

**[ M1 interactive: base value · base year · CAGR (0.26–0.496, real firm spread) · horizon year ]**

**Inline commentary (after the first drag):**
> You just moved a single forecast across a $50-billion-to-$300-billion range without inventing anything — every CAGR on that slider is a number a real research firm published this year. The honest answer to "how big is the agent economy?" isn't a point. It's the width of the band you just swept. **The spread is the finding.** Nine firms disagree by five-to-six times on definition alone — so the rest of this essay is about what *doesn't* move when the headline does.

**Pull-quote (thesis):**
> *Every confident forecast is a set of assumptions someone declined to show you.*

---

## 12. Act II — "What's actually inside it" · Module M2

**H3:** `WHAT "AI AGENTS" ACTUALLY MEANS`

**Lead-in:**
> "AI agents" isn't one thing being measured. It's a bundle. Drag the tiles to set what you think the mix is.

**[ M2 interactive: draggable segment treemap, auto-renormalising; tiles carry the honesty flag ]**

**Honesty flag (on the tiles, `--accent-warn`, required by spec):**
> Starting split is **unverified** (a late-2025 estimate) — that's the point. Drag it to your own and watch the headline move.

**Inline commentary:**
> The same total dollar figure tells four different stories depending on how you slice it — algorithmic trading, call-centre automation, supply chain, and a small crypto-native slice all ride under one label. That crypto slice, the part this essay is really about, is only a couple of percent of the bundle. So when someone quotes "the AI-agent market," ask: *which segment did they have in mind?* The answer usually decides the number.

---

## 13. Act III — "The real engine" · Module M3

**H3:** `WHAT IF AGENTS ACTUALLY PAID PER CALL?`

**Jargon intro (first use of x402, inline):**
> Forget token prices for a moment and watch the plumbing. The breakout pattern is **x402** — a way for software to pay for a single web request on the spot, by answering an "HTTP 402 Payment Required" response with a small stablecoin payment, no account or subscription.

**Lead-in:**
> Set how many machine requests happen a year, how many of them pay, and the price per call.

**[ M3 interactive: api_calls_per_year (log) · pay_per_call_share · avg_price_usd (log) ]**

**Inline commentary:**
> Tiny prices times machine-scale volumes is the whole game: nudge three sliders and the implied economy swings from trivial to enormous. That's the *simulation*. Next to it sits the one number we can actually count today — x402 software is downloaded about **1.08 million times a month**, a real signal that developers are wiring this up, even while the on-chain dollar volume is still being measured. **Adoption of the rails, not the token price, is the thing to watch.**

*(Margin note):* The downloads figure is a live proxy from `data/x402_adoption.json`; the on-chain dollar total is pending a verified source and is labelled so on the figure.

---

## 14. Act IV — "Price ≠ traction" · Module M4

**H3:** `RANK BY PRICE, OR BY WHO'S BUILDING?`

**Lead-in:**
> Here are the crypto-native agent projects. Switch the lens — rank them by token market value, then by how much developers actually use them.

**[ M4 interactive: toggle market-cap ↔ developer-adoption (npm/GitHub); optional hype-discount slider ]**

**Jargon intro (TAO, on first appearance in the list):**
> One entry is **TAO**, the token of Bittensor — a network that pays contributors for useful machine-learning work done by its "subnets."

**Inline commentary:**
> Flip the lens and the ranking reshuffles. A framework like elizaOS sinks near the bottom by token value (about $4M) but climbs near the top by developer use (≈82,600 installs a month). The crypto-native slice cooled off its 2024–25 peak — but the *code* didn't cool with it. Price and traction came apart. If you only watched token caps, you missed the part that kept growing.

---

## 15. Act V — "Will enterprises actually adopt?" · Module M5

**H3:** `THE ADOPTION CURVE — AND ITS ATTRITION`

**Lead-in:**
> Most adoption stories are drawn as a smooth S-curve. Set its ceiling, its steepness, and the year it bends.

**[ M5 interactive: ceiling · k (steepness) · inflection_year; real anchors plotted ]**

**Honesty flag (on the anchor points, required by spec):**
> Anchor points are flagged for re-sourcing before publish — shown here with their origin so you can judge them.

**Inline commentary:**
> The curve is real: enterprise use climbs from under 1% in 2025 toward roughly a third by 2028. But a clean line hides the attrition — more than 40% of agent projects get cancelled, and where agents do land, they often run shallow. Drag the inflection earlier and the optimism is obvious; the gap between *adopting* and *adopting deeply* is the part the smooth curve quietly skips.

---

## 16. Act VI — "Build your own future" + close · Module M6

**H3:** `YOUR 2030`

**Lead-in:**
> Last move. Compose the three levers the whole essay has been pulling apart.

**[ M6 interactive: adoption_speed · regulation_drag · micropayment_boost → narrated 2030 outcome ]**

**Inline commentary (the live readout sentence, mono):**
> "Under your assumptions, the agent economy is about **$X billion** in 2030."

**Closing prose:**
> Notice what just happened: by setting three plain-language dials you reproduced the entire five-to-six-times spread from where we started — except now the assumptions are yours, in the open, instead of buried in someone's slide. That's the whole argument. The agent economy isn't one number, and the honest version of any forecast hands you the controls. The durable signal underneath all of it isn't a token price or a single firm's headline — it's whether agents actually transact. Watch the rails.

**Footer (sourcing line):**
> Every figure in this essay traces to a named source in `data/provenance.json`. Two figures (the segment split and the adoption anchors) ship on flagged, unverified defaults by design — their purpose is to let you distrust them. Last updated 2026-06-30.

---

## 17. Accessibility notes (build requirements, not optional)

1. **Keyboard:** every slider, toggle, and draggable tile operable by keyboard (arrow-step sliders; tiles get +/- weight buttons as a non-pointer path). Visible focus ring on all (`2px --ink`).
2. **Screen readers:** each interactive has an `aria-label` describing what it controls and an `aria-live="polite"` region announcing the live readout (e.g. "2030 estimate: 84 billion dollars"). `aria-valuetext` carries human values ("43.6 percent, Fortune Business Insights").
3. **Not by colour alone:** reader's mark vs. reference curves are distinguished by **weight + direct text label**, not hue. Honesty flags carry text ("unverified"), not just the warn colour.
4. **Contrast:** body and UI text meet WCAG AA (≥4.5:1); large display text ≥3:1. Verified against `--paper`.
5. **Reduced motion:** `prefers-reduced-motion` disables scroll/fade transitions; all interactives remain fully functional (they're input-driven).
6. **No-JS fallback:** each interactive server-renders its default scenario as a labelled static figure with a caption, so the essay's argument survives without scripts.
7. **Targets:** ≥44px touch targets; larger slider handles on coarse pointers.
8. **Motion safety:** no auto-play, no flashing, no parallax, no scroll-jacking.

---

## 18. Handoff & disposition

- **This doc is the build contract** for the site's visual language (§1–§7) and all reader-facing copy (§8–§16) — paired with [`essay-thesis-and-modules.md`](./essay-thesis-and-modules.md), which owns the module logic + data bindings.
- **Open dependency carried from Workstream C:** the `token_traction` model def must be added to `data/models.json` before M4 (Act IV) can be wired — unchanged by this doc.
- **Editor proof required** on Part B before publish (voice, jargon one-liners §9, accessibility phrasing §17).
- **Honesty flags are non-negotiable:** M2 (§12) and M5 (§15) must surface their unverified-default copy in-UI; this is a QA gate, not a stylistic choice.
- **No data invented.** Every figure in copy traces to `data/provenance.json`.

*Authored 2026-06-30 for PRO-18 Workstream D (PRO-22). Consumes Workstream C (PRO-21) thesis + module set. Next: Editor proof, then site-build binds copy to modules.*
