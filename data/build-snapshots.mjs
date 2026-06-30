#!/usr/bin/env node
// Rebuilds the LIVE-tier snapshots in /data from real public APIs (no deps, Node 18+ fetch).
// Snapshot-only sources (Dune, taostats, Kalshi, CryptoRank, research firms) are NOT touched
// here — they need keys/scraping and are documented in sources.json. Run: node data/build-snapshots.mjs
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = dirname(fileURLToPath(import.meta.url));
const now = new Date().toISOString();
const get = async (u) => { const r = await fetch(u, { headers: { "user-agent": "cryptoeconomy-snapshots" } }); if (!r.ok) throw new Error(`${u} -> ${r.status}`); return r.json(); };
const save = (name, obj) => writeFile(join(OUT, name), JSON.stringify(obj, null, 2));

const CG = "https://api.coingecko.com/api/v3";
try {
  const cats = await get(`${CG}/coins/categories?order=market_cap_desc`);
  const pick = (id) => { const c = cats.find((x) => x.id === id); return c && { id, name: c.name, market_cap_usd: Math.round(c.market_cap || 0), volume_24h_usd: Math.round(c.volume_24h || 0), top_3_coins_id: c.top_3_coins_id }; };
  const keep = ["id","symbol","name","current_price","market_cap","market_cap_rank","total_volume","price_change_percentage_24h","circulating_supply","ath","ath_change_percentage"];
  const markets = await get(`${CG}/coins/markets?vs_currency=usd&category=ai-agents&order=market_cap_desc&per_page=20&page=1`);
  await save("ai_agent_tokens.json", {
    _meta: { retrieved: now, source: "CoinGecko API v3", tier: "live", cors: "*", endpoint: `${CG}/coins/markets?vs_currency=usd&category=ai-agents` },
    category_totals: Object.fromEntries(["ai-agents","ai-agent-launchpad","ai-framework","artificial-intelligence"].map((id) => [id, pick(id)])),
    tokens: markets.map((c) => Object.fromEntries(keep.map((k) => [k, c[k]]))),
  });
  console.log("ai_agent_tokens.json ✓");
} catch (e) { console.error("CoinGecko skipped:", e.message); }

try {
  const stab = (await get("https://stablecoins.llama.fi/stablecoins?includePrices=true")).peggedAssets;
  const circ = (sym) => stab.find((x) => x.symbol === sym)?.circulating?.peggedUSD || 0;
  const total = stab.reduce((s, x) => s + (x.circulating?.peggedUSD || 0), 0);
  const protocols = await get("https://api.llama.fi/protocols");
  await save("onchain.json", {
    _meta: { retrieved: now, source: "DefiLlama API", tier: "live", cors: "*" },
    stablecoins: { endpoint: "https://stablecoins.llama.fi/stablecoins?includePrices=true", usdc_circulating_usd: Math.round(circ("USDC")), usdt_circulating_usd: Math.round(circ("USDT")), total_stablecoin_mcap_usd: Math.round(total) },
    defillama_protocols_tracked: protocols.length,
  });
  console.log("onchain.json ✓");
} catch (e) { console.error("DefiLlama skipped:", e.message); }

try {
  const repos = await Promise.all(["x402-foundation/x402","coinbase/x402","elizaOS/eliza"].map((r) => get(`https://api.github.com/repos/${r}`)));
  const npm = async (p) => get(`https://api.npmjs.org/downloads/point/last-month/${p}`);
  const [x, cx, el] = await Promise.all([npm("x402"), npm("@coinbase/x402"), npm("@elizaos/core")]);
  await save("x402_adoption.json", {
    _meta: { retrieved: now, note: "x402 on-chain $ volume lives on Dune (keyed) — see x402_onchain_volume; not invented here." },
    npm_downloads_last_month: [x, cx, el].map((d) => ({ package: d.package, downloads: d.downloads, window: `${d.start}..${d.end}`, tier: "live", cors: "*" })),
    github_repos: repos.map((d) => ({ repo: d.full_name, stars: d.stargazers_count, forks: d.forks_count, pushed_at: d.pushed_at, is_fork: d.fork })),
    x402_onchain_volume: { value: null, status: "snapshot_pending_key", tier: "snapshot", note: "Dune queries 6240463 / 6060125; ~95% on Base. Needs a Dune API key." },
  });
  console.log("x402_adoption.json ✓");
} catch (e) { console.error("GitHub/npm skipped:", e.message); }

console.log("Done. Snapshot-only sources (Dune/taostats/Kalshi/CryptoRank/research firms) require keys — see sources.json.");
