/* PRO-18 / PRO-24 — Explorable essay "Two economies, one name".
 *
 * No build step. Vanilla ES module. Loads committed data/*.json snapshots as the
 * floor (same-origin fetch, always works on Pages), renders all modules instantly,
 * then layers live-API enrichment (npm) on top with a 3 s AbortController timeout
 * and graceful fallback. Every rendered number traces to a key in data/ (see the
 * PRD §4 contract). No numbers are invented here.
 */

const SNAPSHOT_DATE = "2026-06-30";

/* ---------- tiny DOM + format helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) node.append(c);
  return node;
};
const SVGNS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

const usd = (b) => {
  // b is in USD billions
  if (b >= 1000) return `$${(b / 1000).toFixed(2)}T`;
  if (b >= 10) return `$${b.toFixed(0)}B`;
  if (b >= 1) return `$${b.toFixed(1)}B`;
  return `$${(b * 1000).toFixed(0)}M`;
};
const usdRaw = (v) => {
  // v in plain USD
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};
const intl = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;

/* ---------- live fetch with timeout + snapshot fallback ---------- */
async function liveFetch(url, { timeout = 3000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function badge(stage, text, kind = "snapshot") {
  let b = $(".badge", stage);
  if (!b) {
    b = el("span", { class: "badge" });
    $(".stage-head", stage).append(b);
  }
  b.className = `badge badge-${kind}`;
  b.textContent = text;
}

/* ---------- generic stage scaffolding ---------- */
function stageReadout(stage, text) {
  $(".readout", stage).textContent = text;
}
function ariaAnnounce(stage, text) {
  const live = $(".sr-live", stage);
  if (live) live.textContent = text;
}

/* slider factory: native range + mono readout + aria-valuetext */
function slider(stage, { id, label, min, max, step, value, format, scale }) {
  const wrap = el("div", { class: "ctl" });
  const toReal = (s) => (scale === "log" ? Math.pow(10, s) : s);
  const fromReal = (r) => (scale === "log" ? Math.log10(r) : r);
  const input = el("input", {
    type: "range",
    id,
    min: scale === "log" ? fromReal(min) : min,
    max: scale === "log" ? fromReal(max) : max,
    step: scale === "log" ? (fromReal(max) - fromReal(min)) / 200 : step,
    value: scale === "log" ? fromReal(value) : value,
    "aria-label": label,
  });
  const out = el("span", { class: "ctl-val mono" });
  const sync = () => {
    const real = toReal(parseFloat(input.value));
    const shown = format(real);
    out.textContent = shown;
    input.setAttribute("aria-valuetext", `${label}: ${shown}`);
    return real;
  };
  wrap.append(el("label", { class: "ctl-label", for: id, text: label }), input, out);
  return { wrap, input, sync, get: () => toReal(parseFloat(input.value)) };
}

/* ============================================================
 * M1 — Market-size scenario dial (cagr_projection)
 * ========================================================== */
function buildM1(stage, data, models) {
  const firms = data.market_size.firms;
  const spread = data.market_size.cagr_spread_pct;
  const m = models.cagr_projection.inputs;

  badge(stage, `research-firm figures · 2026-06-15`, "snapshot");
  const body = $(".stage-body", stage);

  // chart frame
  const W = 640, H = 320, P = { t: 16, r: 16, b: 34, l: 52 };
  const x0 = 2024, x1 = 2035, y1 = 300;
  const sx = (yr) => P.l + ((yr - x0) / (x1 - x0)) * (W - P.l - P.r);
  const sy = (v) => H - P.b - (v / y1) * (H - P.t - P.b);
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img",
    "aria-label": "Market-size projection curves: published firm forecasts and your scenario." });

  // axes
  for (const yr of [2024, 2026, 2028, 2030, 2032, 2034]) {
    svg.append(svgEl("line", { x1: sx(yr), y1: P.t, x2: sx(yr), y2: H - P.b, class: "grid" }));
    const lab = svgEl("text", { x: sx(yr), y: H - P.b + 18, class: "axis", "text-anchor": "middle" });
    lab.textContent = yr; svg.append(lab);
  }
  for (const v of [0, 100, 200, 300]) {
    svg.append(svgEl("line", { x1: P.l, y1: sy(v), x2: W - P.r, y2: sy(v), class: "grid" }));
    const lab = svgEl("text", { x: P.l - 8, y: sy(v) + 4, class: "axis", "text-anchor": "end" });
    lab.textContent = `$${v}B`; svg.append(lab);
  }

  // reference curves — one per firm (base -> forecast, using firm's own CAGR)
  const refGroup = svgEl("g", {});
  for (const f of firms) {
    const g = f.cagr_pct / 100;
    let d = "";
    for (let yr = f.base_year; yr <= f.forecast_year; yr += 0.5) {
      const v = Math.min(f.base_usd_b * Math.pow(1 + g, yr - f.base_year), y1);
      d += `${d ? "L" : "M"}${sx(yr).toFixed(1)} ${sy(v).toFixed(1)} `;
    }
    refGroup.append(svgEl("path", { d, class: "ref-curve", "data-firm": f.firm }));
  }
  svg.append(refGroup);

  // reader curve (drawn last, on top)
  const readerPath = svgEl("path", { class: "reader-curve" });
  const readerDot = svgEl("circle", { r: 4.5, class: "reader-dot" });
  const readerLbl = svgEl("text", { class: "reader-lbl mono" });
  svg.append(readerPath, readerDot, readerLbl);
  body.append(svg);

  // controls
  const ctls = el("div", { class: "controls" });
  const cBase = slider(stage, { id: "m1-base", label: "Base value (2025 starting size)", min: m.base_value.min, max: m.base_value.max, step: 0.01, value: m.base_value.default, format: (v) => usd(v) });
  // base_year segmented toggle
  const yrSeg = el("div", { class: "seg", role: "radiogroup", "aria-label": "Base year" });
  let baseYear = m.base_year.default;
  m.base_year.fixed_options.forEach((opt) => {
    const btn = el("button", { type: "button", class: "seg-btn" + (opt === baseYear ? " on" : ""), role: "radio",
      "aria-checked": String(opt === baseYear), text: String(opt) });
    btn.addEventListener("click", () => {
      baseYear = opt;
      [...yrSeg.children].forEach((c) => { c.classList.toggle("on", c === btn); c.setAttribute("aria-checked", String(c === btn)); });
      render();
    });
    yrSeg.append(btn);
  });
  const segWrap = el("div", { class: "ctl" }, [el("span", { class: "ctl-label", text: "Base year" }), yrSeg]);
  const cCagr = slider(stage, { id: "m1-cagr", label: "CAGR — compound annual growth rate", min: m.cagr.min, max: m.cagr.max, step: m.cagr.step, value: m.cagr.default,
    format: (v) => `${pct(v)} ${v <= 0.27 ? "· Emergen 26.0%" : v >= 0.49 ? "· Grand View 49.6%" : ""}`.trim() });
  const cHoriz = slider(stage, { id: "m1-horizon", label: "Horizon year", min: m.horizon_year.min, max: m.horizon_year.max, step: 1, value: m.horizon_year.default, format: (v) => String(v) });
  ctls.append(cBase.wrap, segWrap, cCagr.wrap, cHoriz.wrap);
  body.append(ctls);

  // CAGR track end annotations
  cCagr.wrap.append(el("div", { class: "track-ends", html: `<span>${spread.min}% (Emergen)</span><span>${spread.max}% (Grand View)</span>` }));

  function render() {
    const base = cBase.get(), g = cCagr.get(), horizon = Math.round(cHoriz.get());
    cBase.sync(); cCagr.sync(); cHoriz.sync();
    const project = (yr, cg) => base * Math.pow(1 + cg, yr - baseYear);
    // reader path from baseYear..horizon
    let d = "";
    for (let yr = baseYear; yr <= horizon; yr += 0.25) {
      const v = Math.min(project(yr, g), y1);
      d += `${d ? "L" : "M"}${sx(yr).toFixed(1)} ${sy(v).toFixed(1)} `;
    }
    readerPath.setAttribute("d", d);
    const vH = project(horizon, g);
    readerDot.setAttribute("cx", sx(horizon)); readerDot.setAttribute("cy", sy(Math.min(vH, y1)));
    readerLbl.setAttribute("x", Math.min(sx(horizon), W - 60)); readerLbl.setAttribute("y", sy(Math.min(vH, y1)) - 10);
    readerLbl.textContent = usd(vH);

    // swing readout: same base+horizon at CAGR extremes
    const lo = project(horizon, spread.min / 100), hi = project(horizon, spread.max / 100);
    stageReadout(stage, usd(vH));
    $(".m1-swing").innerHTML =
      `Your ${horizon} value: <b class="mono">${usd(vH)}</b> &nbsp;·&nbsp; same dials at the real CAGR spread: ` +
      `<span class="mono">${usd(lo)}</span> (26.0%) → <span class="mono">${usd(hi)}</span> (49.6%).`;
    ariaAnnounce(stage, `Projected ${horizon} value ${usd(vH)}. At the firm CAGR spread, ${usd(lo)} to ${usd(hi)}.`);
  }
  body.append(el("p", { class: "m1-swing figure-note" }));
  [cBase.input, cCagr.input, cHoriz.input].forEach((i) => i.addEventListener("input", render));
  render();
}

/* ============================================================
 * M2 — Re-weightable segment treemap (segment_reweight)
 * ========================================================== */
function buildM2(stage, models) {
  const m = models.segment_reweight.inputs;
  const total = m.total_market.default; // 8.03 USD_B
  const labels = {
    algorithmic_trading: "Algorithmic trading",
    ai_call_centers: "AI call centres",
    supply_chain: "Supply chain",
    crypto_agents: "Crypto-native agents",
    other: "Other",
  };
  const keys = Object.keys(m.weights.default);
  let weights = { ...m.weights.default };

  badge(stage, `derived · ${SNAPSHOT_DATE}`, "snapshot");
  const body = $(".stage-body", stage);

  // persistent honesty flag (required by spec §3 M2)
  body.append(el("p", { class: "honesty",
    html: `<span class="warn-tag">UNVERIFIED DEFAULT</span> Starting split is a late-2025 estimate — that's the point. Drag it to your own and watch the headline move.` }));

  const rows = el("div", { class: "treemap" });
  body.append(rows);

  function renormalize(changedKey, newVal) {
    newVal = Math.max(0, Math.min(1, newVal));
    const others = keys.filter((k) => k !== changedKey);
    const otherSum = others.reduce((s, k) => s + weights[k], 0);
    const remain = 1 - newVal;
    if (otherSum <= 0) {
      others.forEach((k) => (weights[k] = remain / others.length));
    } else {
      others.forEach((k) => (weights[k] = (weights[k] / otherSum) * remain));
    }
    weights[changedKey] = newVal;
    render();
  }

  function render() {
    rows.innerHTML = "";
    keys.forEach((k) => {
      const w = weights[k], dollars = total * w;
      const row = el("div", { class: "tm-row" });
      const bar = el("div", { class: "tm-bar", style: `width:${(w * 100).toFixed(1)}%` });
      const head = el("div", { class: "tm-head" }, [
        el("span", { class: "tm-name", text: labels[k] }),
        el("span", { class: "tm-val mono", text: `${usd(dollars)} · ${pct(w)}` }),
      ]);
      // range + number fallback (keyboard-operable)
      const range = el("input", { type: "range", min: 0, max: 1, step: 0.005, value: w,
        "aria-label": `${labels[k]} weight`, "aria-valuetext": `${labels[k]}: ${pct(w)}` });
      range.addEventListener("input", () => renormalize(k, parseFloat(range.value)));
      const num = el("input", { type: "number", min: 0, max: 100, step: 0.5, value: (w * 100).toFixed(1),
        class: "tm-num", "aria-label": `${labels[k]} percent` });
      num.addEventListener("change", () => renormalize(k, parseFloat(num.value) / 100));
      row.append(head, bar, el("div", { class: "tm-inputs" }, [range, num, el("span", { class: "tm-pct", text: "%" })]));
      rows.append(row);
    });
    const cryptoUsd = total * weights.crypto_agents;
    stageReadout(stage, `${usd(cryptoUsd)} crypto`);
    ariaAnnounce(stage, `Crypto-native slice now ${usd(cryptoUsd)}, ${pct(weights.crypto_agents)} of the ${usd(total)} bundle.`);
  }
  render();
}

/* ============================================================
 * M3 — x402 adoption simulator (x402_adoption)
 * ========================================================== */
function buildM3(stage, data, models) {
  const m = models.x402_adoption.inputs;
  const x402 = data.x402_adoption;
  const snapNpm = x402.npm_downloads_last_month.find((p) => p.package === "x402");

  const body = $(".stage-body", stage);
  badge(stage, `snapshot · ${SNAPSHOT_DATE}`, "snapshot");

  const ctls = el("div", { class: "controls" });
  const cCalls = slider(stage, { id: "m3-calls", label: "Machine API calls per year", min: m.api_calls_per_year.min, max: m.api_calls_per_year.max, value: m.api_calls_per_year.default, scale: "log", format: (v) => `${intl(v)} calls` });
  const cShare = slider(stage, { id: "m3-share", label: "Share that pay per call", min: m.pay_per_call_share.min, max: m.pay_per_call_share.max, step: m.pay_per_call_share.step, value: m.pay_per_call_share.default, format: (v) => pct(v, 1) });
  const cPrice = slider(stage, { id: "m3-price", label: "Average price per call", min: m.avg_price_usd.min, max: m.avg_price_usd.max, value: m.avg_price_usd.default, scale: "log", format: (v) => `$${v < 0.01 ? v.toFixed(4) : v.toFixed(3)}` });
  ctls.append(cCalls.wrap, cShare.wrap, cPrice.wrap);
  body.append(ctls);

  // anchor panel: real npm proxy + pending on-chain
  const anchors = el("div", { class: "anchors" });
  const npmCard = el("div", { class: "anchor-card" }, [
    el("div", { class: "anchor-k", text: "x402 npm installs / month (real)" }),
    el("div", { class: "anchor-v mono", id: "m3-npm", text: intl(snapNpm.downloads) }),
    el("div", { class: "anchor-sub", id: "m3-npm-src", text: `snapshot · ${snapNpm.window}` }),
  ]);
  const chainCard = el("div", { class: "anchor-card" }, [
    el("div", { class: "anchor-k", text: "on-chain $ volume" }),
    el("div", { class: "anchor-v mono dim", text: "pending" }),
    el("div", { class: "anchor-sub", text: "pending Dune key — not fabricated" }),
  ]);
  anchors.append(npmCard, chainCard);
  body.append(anchors);
  body.append(el("p", { class: "figure-note",
    html: `The big number is your <b>modeled</b> what-if. The installs count beside it is the one thing we can actually measure today — adoption of the rails, not a token price.` }));

  function render() {
    const calls = cCalls.get(), share = cShare.get(), price = cPrice.get();
    cCalls.sync(); cShare.sync(); cPrice.sync();
    const vol = calls * share * price; // sim_volume
    stageReadout(stage, `${usdRaw(vol)}/yr modeled`);
    ariaAnnounce(stage, `Modeled annual micropayment volume ${usdRaw(vol)}.`);
  }
  [cCalls.input, cShare.input, cPrice.input].forEach((i) => i.addEventListener("input", render));
  render();

  // live enrichment: npm last-month for x402, fall back to snapshot
  liveFetch("https://api.npmjs.org/downloads/point/last-month/x402")
    .then((j) => {
      if (j && typeof j.downloads === "number") {
        $("#m3-npm").textContent = intl(j.downloads);
        $("#m3-npm-src").textContent = `live · ${j.start}…${j.end}`;
        badge(stage, `live npm · ${new Date().toISOString().slice(11, 16)} UTC`, "live");
      }
    })
    .catch(() => { /* keep snapshot, badge already says snapshot */ });
}

/* ============================================================
 * M4 — Token-vs-traction explorer (token_traction, PRD §3 M4)
 *
 * Re-rank the same set of projects under three lenses — token market cap,
 * npm installs/month, GitHub stars — to surface the price↔traction decoupling.
 * Caps: CoinGecko (live → ai_agent_tokens.json snapshot) + TAO (bittensor.json).
 * Traction: npm + GitHub (live → x402_adoption.json snapshot). No value invented:
 * a row missing a metric shows 'n/a', never zero-filled.
 * ========================================================== */
function buildM4(stage, data, models) {
  const def = models.token_traction;
  const m = def.inputs;
  const body = $(".stage-body", stage);
  badge(stage, `CoinGecko + npm + GitHub · snapshot`, "snapshot");

  // ---- rows assembled from the committed snapshots (the floor) ----
  // Traction lookups from x402_adoption.json.
  const npmBy = Object.fromEntries(data.x402_adoption.npm_downloads_last_month.map((d) => [d.package, d.downloads]));
  const starsBy = Object.fromEntries(data.x402_adoption.github_repos.map((r) => [r.repo, r.stars]));
  // Join: which token id maps to which npm package + GitHub repo. elizaOS is the
  // one cap-bearing project that also has measured developer traction in today's data.
  const TRACTION_JOIN = { elizaos: { npm: "@elizaos/core", gh: "elizaOS/eliza" } };

  // Cap-bearing rows: AI-agent tokens (CoinGecko, tier:live) + TAO (CoinGecko via bittensor.json),
  // each with traction attached where a join exists (else npm/stars stay null → 'n/a').
  const tao = data.bittensor.tao_token;
  const rows = data.ai_agent_tokens.tokens.map((t) => {
    const j = TRACTION_JOIN[t.id];
    return {
      key: t.id, name: t.name, symbol: t.symbol.toUpperCase(), kind: "token",
      cap: t.market_cap,
      npm: j ? (npmBy[j.npm] ?? null) : null, stars: j ? (starsBy[j.gh] ?? null) : null,
      npmSrc: j ? j.npm : null, ghSrc: j ? j.gh : null,
    };
  });
  rows.push({ key: "bittensor", name: "Bittensor", symbol: "TAO", kind: "token",
    cap: tao.market_cap_usd, npm: null, stars: null, npmSrc: null, ghSrc: null });

  // Traction-only row: x402 is the rail itself — huge developer traction, no token,
  // so cap = n/a (honest, never zero-filled).
  rows.push({ key: "x402", name: "x402", symbol: "rails", kind: "traction",
    cap: null, npm: npmBy["x402"] ?? null, stars: starsBy["x402-foundation/x402"] ?? null,
    npmSrc: "x402", ghSrc: "x402-foundation/x402" });

  // ---- lenses + metric accessors ----
  const LENSES = {
    market_cap_usd:      { label: "Token cap",        col: "cap",   short: "cap" },
    npm_downloads_month: { label: "npm installs / mo", col: "npm",   short: "installs/mo" },
    github_stars:        { label: "GitHub stars",      col: "stars", short: "stars" },
  };
  let lens = m.rank_metric.default; // "market_cap_usd"
  let hype = m.hype_discount.default; // 0

  const effCap = (row) => (row.cap == null ? null : row.cap * (1 - hype));
  const metricVal = (row, ln) => {
    if (ln === "market_cap_usd") return effCap(row);
    return row[LENSES[ln].col]; // npm | stars (null = n/a)
  };
  // implied_value = effective_cap / max(traction_metric, 1); traction = the chosen
  // dev-use lens, or npm (else stars) as the default proxy under the cap lens.
  const tractionDenom = (row, ln) => {
    if (ln === "npm_downloads_month") return row.npm;
    if (ln === "github_stars") return row.stars;
    return row.npm != null ? row.npm : row.stars;
  };
  const tractionUnit = (ln) => (ln === "github_stars" ? "star" : "install");
  const impliedVal = (row, ln) => {
    const c = effCap(row), tr = tractionDenom(row, ln);
    if (c == null || tr == null) return null;
    return c / Math.max(tr, 1);
  };
  const fmtMetric = (v, ln) => {
    if (v == null) return "n/a";
    return ln === "market_cap_usd" ? usdRaw(v) : intl(v);
  };

  // ---- controls ----
  const ctls = el("div", { class: "controls" });
  const seg = el("div", { class: "seg", role: "radiogroup", "aria-label": "Rank lens" });
  Object.entries(LENSES).forEach(([k, v]) => {
    const btn = el("button", { type: "button", class: "seg-btn" + (k === lens ? " on" : ""),
      role: "radio", "aria-checked": String(k === lens), text: v.label });
    btn.addEventListener("click", () => {
      lens = k;
      [...seg.children].forEach((c, i) => {
        const on = Object.keys(LENSES)[i] === lens;
        c.classList.toggle("on", on); c.setAttribute("aria-checked", String(on));
      });
      render(true);
    });
    seg.append(btn);
  });
  const segWrap = el("div", { class: "ctl" }, [el("span", { class: "ctl-label", text: "Rank by" }), seg]);
  const cHype = slider(stage, { id: "m4-hype", label: "Hype discount (re-price caps toward fundamentals)",
    min: m.hype_discount.min, max: m.hype_discount.max, step: m.hype_discount.step, value: m.hype_discount.default,
    format: (v) => (v === 0 ? "0% — caps as quoted" : `−${pct(v, 0)} on every token cap`) });
  cHype.input.addEventListener("input", () => { hype = cHype.get(); cHype.sync(); render(false); });
  ctls.append(segWrap, cHype.wrap);
  body.append(ctls);

  // ---- table ----
  const list = el("div", { class: "tt" });
  body.append(list);
  const rowEls = new Map(); // key -> { node, rank, cells:{cap,npm,stars}, implied }
  rows.forEach((row) => {
    const rank = el("span", { class: "tt-rank mono" });
    const cap = el("span", { class: "tt-v mono" });
    const npm = el("span", { class: "tt-v mono" });
    const stars = el("span", { class: "tt-v mono" });
    const implied = el("span", { class: "tt-v mono" });
    const capCell = el("div", { class: "tt-cell", "data-lens": "market_cap_usd" },
      [el("span", { class: "tt-k", text: "cap" }), cap]);
    const npmCell = el("div", { class: "tt-cell", "data-lens": "npm_downloads_month" },
      [el("span", { class: "tt-k", text: "installs/mo" }), npm]);
    const starCell = el("div", { class: "tt-cell", "data-lens": "github_stars" },
      [el("span", { class: "tt-k", text: "stars" }), stars]);
    const impCell = el("div", { class: "tt-cell tt-implied" },
      [el("span", { class: "tt-k", text: "cap ÷ use" }), implied]);
    const node = el("div", { class: `tt-row tt-${row.kind}`, "data-key": row.key }, [
      rank,
      el("div", { class: "tt-name" }, [
        el("span", { class: "tt-proj", text: row.name }),
        el("span", { class: "tt-sym mono", text: row.symbol }),
      ]),
      el("div", { class: "tt-cells" }, [capCell, npmCell, starCell, impCell]),
    ]);
    list.append(node);
    rowEls.set(row.key, { node, rank, cells: { market_cap_usd: capCell, npm_downloads_month: npmCell, github_stars: starCell }, cap, npm, stars, implied });
  });

  // honesty / provenance carry-over (PRD §3 M4 + model real_anchor note)
  body.append(el("p", { class: "honesty", html:
    `<span class="warn-tag">Modeled lens · live+snapshot data</span> Caps are CoinGecko (live, falls back to a ${SNAPSHOT_DATE} snapshot); ` +
    `installs are npm last-month; stars are GitHub. A project missing a metric shows <span class="mono">n/a</span> — never zero. ` +
    `<span class="mono">cap ÷ use</span> only computes for a project that has <i>both</i> a token cap and measured developer traction — ` +
    `today that's <b>elizaOS</b> alone (≈${usdRaw(4017187)} cap over ~82.6k installs/mo), while x402's traction carries no token at all. That gap is the decoupling.` }));

  // ---- render with FLIP re-rank animation ----
  function sortedKeys() {
    const withVal = rows.map((r) => ({ r, v: metricVal(r, lens) }));
    withVal.sort((a, b) => {
      const an = a.v == null, bn = b.v == null;
      if (an && bn) return a.r.name.localeCompare(b.r.name); // n/a rows: stable by name, at bottom
      if (an) return 1;
      if (bn) return -1;
      return b.v - a.v;
    });
    return withVal.map((x) => x.r.key);
  }

  function render(animate) {
    const order = sortedKeys();
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;

    // FLIP: measure first positions
    const first = new Map();
    if (animate && !reduce) rowEls.forEach((ref, key) => first.set(key, ref.node.getBoundingClientRect().top));

    // reorder DOM + update active-lens highlight + values
    order.forEach((key, i) => {
      const row = rows.find((r) => r.key === key);
      const ref = rowEls.get(key);
      list.append(ref.node);
      const mv = metricVal(row, lens);
      ref.rank.textContent = mv == null ? "—" : `#${i + 1}`;
      ref.node.classList.toggle("tt-na", mv == null);
      ref.cap.textContent = fmtMetric(effCap(row), "market_cap_usd");
      ref.npm.textContent = fmtMetric(row.npm, "npm_downloads_month");
      ref.stars.textContent = fmtMetric(row.stars, "github_stars");
      const imp = impliedVal(row, lens);
      ref.implied.textContent = imp == null ? "n/a" : `${usdRaw(imp)}/${tractionUnit(lens)}`;
      Object.entries(ref.cells).forEach(([k, cell]) => cell.classList.toggle("on", k === lens));
    });

    // FLIP: invert + play
    if (animate && !reduce) {
      rowEls.forEach((ref, key) => {
        const delta = (first.get(key) ?? 0) - ref.node.getBoundingClientRect().top;
        if (delta) {
          ref.node.style.transition = "none";
          ref.node.style.transform = `translateY(${delta}px)`;
          requestAnimationFrame(() => {
            ref.node.style.transition = "transform .4s cubic-bezier(.2,.7,.2,1)";
            ref.node.style.transform = "";
          });
        }
      });
    }

    const top = rows.find((r) => r.key === order[0]);
    const ln = LENSES[lens];
    stageReadout(stage, `${ln.label}: ${top.name}`);
    ariaAnnounce(stage, `Ranked by ${ln.label}${hype > 0 ? `, caps discounted ${pct(hype, 0)}` : ""}. Top project ${top.name}.`);
  }
  render(false);

  // ---- live enrichment (best-effort; snapshot stays if any call fails) ----
  (async () => {
    let live = false;
    const byId = Object.fromEntries(rows.map((r) => [r.key, r]));
    const tryUpdate = async (label, fn) => { try { if (await fn()) live = true; } catch { /* keep snapshot */ } };

    await Promise.all([
      // CoinGecko caps for AI-agent tokens
      tryUpdate("coingecko", async () => {
        const j = await liveFetch(data.ai_agent_tokens._meta.endpoint);
        if (!Array.isArray(j)) return false;
        let hit = false;
        j.forEach((c) => { if (byId[c.id] && typeof c.market_cap === "number") { byId[c.id].cap = c.market_cap; hit = true; } });
        return hit;
      }),
      // npm last-month for each tracked package
      ...["@elizaos/core", "x402"].map((pkg) => tryUpdate("npm", async () => {
        const j = await liveFetch(`https://api.npmjs.org/downloads/point/last-month/${pkg}`);
        if (!j || typeof j.downloads !== "number") return false;
        const r = rows.find((x) => x.npmSrc === pkg); if (r) { r.npm = j.downloads; return true; }
        return false;
      })),
      // GitHub stars for each tracked repo
      ...["elizaOS/eliza", "x402-foundation/x402"].map((repo) => tryUpdate("github", async () => {
        const j = await liveFetch(`https://api.github.com/repos/${repo}`);
        if (!j || typeof j.stargazers_count !== "number") return false;
        const r = rows.find((x) => x.ghSrc === repo); if (r) { r.stars = j.stargazers_count; return true; }
        return false;
      })),
    ]);

    if (live) {
      render(false);
      badge(stage, `live · ${new Date().toISOString().slice(11, 16)} UTC`, "live");
    }
  })();
}

/* ============================================================
 * M5 — Enterprise-adoption S-curve (enterprise_scurve)
 * ========================================================== */
function buildM5(stage, models) {
  const def = models.enterprise_scurve;
  const m = def.inputs;
  const realAnchors = def.real_anchors;

  const body = $(".stage-body", stage);
  badge(stage, `verified Gartner anchors · snapshot`, "snapshot");

  body.append(el("p", { class: "figure-note",
    html: `Anchor points are verified Gartner datapoints (under 1% in 2024 → ~33% by 2028; from Gartner’s 2025 agentic-AI briefing, cited in <a href="#sources">Sources</a>). The curve between and beyond them is your scenario.` }));

  const W = 640, H = 300, P = { t: 16, r: 16, b: 34, l: 44 };
  const x0 = 2024, x1 = 2032;
  const sx = (yr) => P.l + ((yr - x0) / (x1 - x0)) * (W - P.l - P.r);
  const sy = (v) => H - P.b - v * (H - P.t - P.b);
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img",
    "aria-label": "Enterprise adoption S-curve with real anchor points." });
  for (const yr of [2024, 2026, 2028, 2030, 2032]) {
    svg.append(svgEl("line", { x1: sx(yr), y1: P.t, x2: sx(yr), y2: H - P.b, class: "grid" }));
    const t = svgEl("text", { x: sx(yr), y: H - P.b + 18, class: "axis", "text-anchor": "middle" }); t.textContent = yr; svg.append(t);
  }
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    svg.append(svgEl("line", { x1: P.l, y1: sy(v), x2: W - P.r, y2: sy(v), class: "grid" }));
    const t = svgEl("text", { x: P.l - 8, y: sy(v) + 4, class: "axis", "text-anchor": "end" }); t.textContent = `${v * 100}%`; svg.append(t);
  }
  const curve = svgEl("path", { class: "reader-curve" });
  svg.append(curve);
  // anchors
  realAnchors.forEach((a) => {
    svg.append(svgEl("circle", { cx: sx(a.year), cy: sy(a.value), r: 5, class: "ref-anchor" }));
    const t = svgEl("text", { x: sx(a.year), y: sy(a.value) - 10, class: "axis anchor-lbl", "text-anchor": "middle" });
    t.textContent = `${a.year}: ${(a.value * 100).toFixed(0)}% (verified)`; svg.append(t);
  });
  body.append(svg);

  const ctls = el("div", { class: "controls" });
  const cCeil = slider(stage, { id: "m5-ceil", label: "Ceiling (max adoption share)", min: m.ceiling.min, max: m.ceiling.max, step: 0.01, value: m.ceiling.default, format: (v) => pct(v, 0) });
  const cK = slider(stage, { id: "m5-k", label: "Steepness (k)", min: m.k.min, max: m.k.max, step: 0.05, value: m.k.default, format: (v) => v.toFixed(2) });
  const cInf = slider(stage, { id: "m5-inf", label: "Inflection year", min: m.inflection_year.min, max: m.inflection_year.max, step: 0.5, value: m.inflection_year.default, format: (v) => v.toFixed(1) });
  ctls.append(cCeil.wrap, cK.wrap, cInf.wrap);
  body.append(ctls);

  // attrition caveat near ceiling (required §3 M5)
  body.append(el("p", { class: "figure-note attrition",
    html: `A clean line hides the <b>attrition</b>: more than 40% of agent projects get cancelled, and where agents do land they often run shallow (≤10% per-function depth). The gap between <i>adopting</i> and <i>adopting deeply</i> is what the smooth curve skips.` }));

  function render() {
    const ceiling = cCeil.get(), k = cK.get(), inf = cInf.get();
    cCeil.sync(); cK.sync(); cInf.sync();
    const adopt = (t) => ceiling / (1 + Math.exp(-k * (t - inf)));
    let d = "";
    for (let yr = x0; yr <= x1; yr += 0.1) d += `${d ? "L" : "M"}${sx(yr).toFixed(1)} ${sy(adopt(yr)).toFixed(1)} `;
    curve.setAttribute("d", d);
    const v28 = adopt(2028);
    stageReadout(stage, `${pct(adopt(2030), 0)} by 2030`);
    ariaAnnounce(stage, `Modeled adoption ${pct(adopt(2030), 0)} by 2030; ${pct(v28, 0)} at 2028.`);
  }
  [cCeil.input, cK.input, cInf.input].forEach((i) => i.addEventListener("input", render));
  render();
}

/* ============================================================
 * M6 — Build-your-future composite (build_your_future)
 * ========================================================== */
function buildM6(stage, models) {
  const m = models.build_your_future.inputs;
  const baseValue = m.base_value.default, baseCagr = m.base_cagr.default, baseYear = m.base_year.default;
  const CLAMP = [0.26, 0.55];

  const body = $(".stage-body", stage);
  badge(stage, `snapshot · ${SNAPSHOT_DATE}`, "snapshot");

  const ctls = el("div", { class: "controls" });
  const cSpeed = slider(stage, { id: "m6-speed", label: "Adoption speed (growth multiplier)", min: m.adoption_speed.min, max: m.adoption_speed.max, step: 0.05, value: m.adoption_speed.default, format: (v) => `${v.toFixed(2)}×` });
  const cReg = slider(stage, { id: "m6-reg", label: "Regulation drag", min: m.regulation_drag.min, max: m.regulation_drag.max, step: 0.01, value: m.regulation_drag.default, format: (v) => pct(v, 0) });
  const cMicro = slider(stage, { id: "m6-micro", label: "Micropayment boost (x402 uplift)", min: m.micropayment_boost.min, max: m.micropayment_boost.max, step: 0.01, value: m.micropayment_boost.default, format: (v) => `+${pct(v, 0)}` });
  ctls.append(cSpeed.wrap, cReg.wrap, cMicro.wrap);
  body.append(ctls);

  const sentence = el("p", { class: "m6-sentence" });
  body.append(sentence);

  function render() {
    const speed = cSpeed.get(), reg = cReg.get(), micro = cMicro.get();
    cSpeed.sync(); cReg.sync(); cMicro.sync();
    let eff = baseCagr * speed * (1 - reg) * (1 + micro);
    const clamped = Math.max(CLAMP[0], Math.min(CLAMP[1], eff));
    const v2030 = baseValue * Math.pow(1 + clamped, 2030 - baseYear);
    stageReadout(stage, usd(v2030));
    const clampNote = eff !== clamped ? ` <span class="figure-note">(growth clamped to the ${pct(CLAMP[0],0)}–${pct(CLAMP[1],0)} real-evidence envelope)</span>` : "";
    sentence.innerHTML =
      `Under your assumptions, the agent economy is about <b class="mono">${usd(v2030)}</b> in 2030 ` +
      `<span class="figure-note">— effective CAGR <span class="mono">${pct(clamped)}</span>, your scenario / modeled.</span>${clampNote}`;
    ariaAnnounce(stage, `2030 estimate ${usd(v2030)}, effective CAGR ${pct(clamped)}.`);
  }
  [cSpeed.input, cReg.input, cMicro.input].forEach((i) => i.addEventListener("input", render));
  render();
}

/* ============================================================
 * Sources: render the provenance ledger as reader-facing citations
 * (named sources + links + retrieval dates), never as file paths.
 * ========================================================== */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso || "";
  return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}
const FIRM_RE = /Fortune Business|Emergen|Roots Analysis|Precedence|Mordor|Market\.us|Grand View|MarketsandMarkets/i;

async function buildSources() {
  const host = $("#source-list");
  if (!host) return;
  let figs;
  try {
    const prov = await fetch("./data/provenance.json").then((r) => r.json());
    figs = (prov.figures || []).filter((f) => f && f.url && f.source);
  } catch (e) {
    host.replaceChildren(el("p", { class: "figure-note",
      text: "Source citations could not be loaded right now — see the research notes linked below." }));
    return;
  }

  // Dedupe by source name; collect what each backs, latest retrieval date, live-ness.
  const bySource = new Map();
  for (const f of figs) {
    let g = bySource.get(f.source);
    if (!g) { g = { source: f.source, url: f.url, labels: [], retrieved: "", live: false }; bySource.set(f.source, g); }
    if (f.label && !g.labels.includes(f.label)) g.labels.push(f.label);
    if ((f.retrieved || "") > g.retrieved) g.retrieved = f.retrieved || "";
    if (f.tier === "live") g.live = true;
  }

  const groups = [
    { title: "Live market & on-chain data", test: (g) => g.live },
    { title: "Market-size forecasts (nine research firms)", test: (g) => !g.live && FIRM_RE.test(g.source) },
    { title: "Reports, funding rounds & predictions", test: (g) => !g.live && !FIRM_RE.test(g.source) },
  ];
  const all = [...bySource.values()];
  const used = new Set();

  host.replaceChildren();
  for (const grp of groups) {
    const items = all.filter((g) => grp.test(g) && !used.has(g.source))
      .sort((a, b) => a.source.localeCompare(b.source));
    items.forEach((g) => used.add(g.source));
    if (!items.length) continue;

    const ol = el("ol", { class: "src-items" });
    for (const g of items) {
      const what = g.labels.slice(0, 2).join("; ") + (g.labels.length > 2 ? `; +${g.labels.length - 2} more` : "");
      const nameLink = el("a", { class: "src-name", href: g.url, rel: "noopener", target: "_blank", text: g.source });
      const tag = el("span", { class: g.live ? "src-tag live" : "src-tag", text: g.live ? "live" : "snapshot" });
      const when = g.retrieved ? ` ${fmtDate(g.retrieved)}` : "";
      const meta = el("div", { class: "src-meta",
        text: g.retrieved
          ? `${g.live ? "Re-fetched live · last verified" : "Retrieved"}${when}`
          : (g.live ? "Re-fetched live in your browser" : "Build-time snapshot") });
      const body = el("div", {}, [
        el("div", {}, [nameLink, tag]),
        el("div", { class: "src-what", text: what }),
        meta,
      ]);
      ol.append(el("li", {}, [body]));
    }
    host.append(el("div", { class: "src-group" }, [
      el("p", { class: "src-group-h", text: grp.title }),
      ol,
    ]));
  }
}

/* ============================================================
 * Boot: load snapshots (the floor), then build every module.
 * ========================================================== */
async function boot() {
  // Citations render independently of the module data so the Sources
  // section always populates, even if a module dataset fails to load.
  buildSources();

  const files = ["market_size", "x402_adoption", "ai_agent_tokens", "bittensor"];
  let data = {}, models;
  try {
    const [loaded, modelsRaw] = await Promise.all([
      Promise.all(files.map((f) => fetch(`./data/${f}.json`).then((r) => r.json()))),
      fetch("./data/models.json").then((r) => r.json()),
    ]);
    files.forEach((f, i) => (data[f] = loaded[i]));
    models = Object.fromEntries(modelsRaw.models.map((mm) => [mm.id, mm]));
  } catch (e) {
    document.querySelectorAll(".stage-body").forEach((b) => {
      b.append(el("p", { class: "honesty", text: "Data could not be loaded. Serve this page over http (e.g. GitHub Pages or a local static server); opening it directly via file:// blocks same-origin data fetches in some browsers." }));
    });
    return;
  }

  buildM1($("#m1"), data, models);
  buildM2($("#m2"), models);
  buildM3($("#m3"), data, models);
  buildM4($("#m4"), data, models);
  buildM5($("#m5"), models);
  buildM6($("#m6"), models);

  // scroll progress + act markers
  const acts = [...document.querySelectorAll("section.act")];
  const marks = [...document.querySelectorAll(".progress .mark")];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const idx = acts.indexOf(en.target);
        if (idx >= 0 && en.isIntersecting) marks.forEach((mk, i) => mk.classList.toggle("on", i <= idx));
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    acts.forEach((a) => io.observe(a));
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
