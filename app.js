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
 * M4 — Token-vs-traction (token_traction model def PENDING, PRD §6)
 * ========================================================== */
function buildM4(stage) {
  const body = $(".stage-body", stage);
  badge(stage, "blocked · model def pending", "pending");
  body.append(
    el("div", { class: "stub" }, [
      el("p", { html: `<span class="warn-tag">PENDING MODEL DEF</span> This interactive is wired but waiting on one data dependency.` }),
      el("p", { class: "figure-note", html:
        `The re-rank logic (<span class="mono">implied_value = market_cap / max(traction, 1)</span>) needs the ` +
        `<span class="mono">token_traction</span> model definition committed to <span class="mono">data/models.json</span> ` +
        `(owned by the data-layer workstream, PRO-18 §6). The other five interactives below are live now; this one ` +
        `lights up the moment that model def lands — no other change required.` }),
      el("p", { class: "figure-note", html:
        `What it will show, from already-committed data: elizaOS sinks near the bottom by token value yet climbs near the ` +
        `top by developer use (≈82,600 installs/mo), while TAO (Bittensor, ${usdRaw(1946350563)}) and Virtuals reposition — ` +
        `price and traction coming apart.` }),
    ])
  );
  stageReadout(stage, "pending");
}

/* ============================================================
 * M5 — Enterprise-adoption S-curve (enterprise_scurve)
 * ========================================================== */
function buildM5(stage, models) {
  const def = models.enterprise_scurve;
  const m = def.inputs;
  const realAnchors = def.real_anchors;

  const body = $(".stage-body", stage);
  badge(stage, `Gartner anchors · snapshot`, "snapshot");

  body.append(el("p", { class: "honesty",
    html: `<span class="warn-tag">LEGACY — RE-SOURCE</span> Anchor points are flagged for re-sourcing before publish; shown with their origin so you can judge them.` }));

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
    t.textContent = `${a.year}: ${(a.value * 100).toFixed(0)}% (legacy)`; svg.append(t);
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
 * Boot: load snapshots (the floor), then build every module.
 * ========================================================== */
async function boot() {
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
  buildM4($("#m4"));
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
