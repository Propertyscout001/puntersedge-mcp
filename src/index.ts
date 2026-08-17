#!/usr/bin/env node
/**
 * PuntersEdge MCP server — live Australian racing and sports odds.
 *
 * WHY THIS EXISTS. Every UTM-attributed signup this API has ever had came from an AI
 * assistant, and AI agents out-fetch Googlebot roughly 6:1 on its marketing pages. Until now a
 * model could CITE the API but could not USE it. This closes that: the same feed, callable from
 * inside Claude, ChatGPT, Cursor or anything else that speaks MCP.
 *
 * DELIBERATELY NOT EXPOSED: /v1/arb/racing and /v1/racing/exchange. Both return 200 to an
 * internal key and 410 to a customer — they are withheld pending a Betfair licence. A tool that
 * 410s for every real user is worse than no tool, and a public package should not put a shop
 * window in front of the one area under licence review. Sports arbitrage endpoints work for
 * customers but are left out for the same reason; add them deliberately, not by default.
 *
 * Endpoints and parameters here were enumerated from the LIVE openapi.json, never from memory.
 * That rule exists because every comparison page on the site once shipped a curl for
 * `/v1/odds?sport=afl`, an endpoint that has never existed.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = (process.env.PUNTERSEDGE_BASE_URL ?? "https://api.puntersedge.online/v1").replace(/\/+$/, "");
const KEY = process.env.PUNTERSEDGE_API_KEY ?? "";
const VERSION = "0.1.0";

/**
 * One fetch path for every tool.
 *
 * Sends `Accept-Encoding: gzip` explicitly. Measured on this API, responses are JSON and
 * compress about 9x — the single largest client-side saving available, and one no server change
 * can make on the caller's behalf. Node's fetch decompresses transparently.
 *
 * Surfaces the credit headers on every call. The API meters on credits, and without this a
 * caller can only discover its balance by spending another request.
 */
async function call(path: string, params: Record<string, unknown> = {}) {
  if (!KEY) {
    return {
      error: "PUNTERSEDGE_API_KEY is not set.",
      how_to_fix:
        "Get a free key at https://puntersedge.online/api (1,500 credits/month, no card) and set " +
        "PUNTERSEDGE_API_KEY in this server's environment.",
    };
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const url = `${BASE}${path}${qs.toString() ? `?${qs}` : ""}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "X-API-Key": KEY,
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "User-Agent": `puntersedge-mcp/${VERSION}`,
      },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    return { error: `Could not reach the PuntersEdge API: ${(e as Error).message}`, url };
  }

  const credits = {
    cost: res.headers.get("x-credits-cost"),
    used: res.headers.get("x-credits-used"),
    limit: res.headers.get("x-credits-limit"),
    remaining: res.headers.get("x-credits-remaining"),
  };

  const text = await res.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = text; }

  if (!res.ok) {
    // 402 carries an upgrade recommendation in headers; pass it through rather than making the
    // model infer what to do from prose.
    const upgrade = res.headers.get("x-upgrade-url")
      ? {
          plan: res.headers.get("x-upgrade-plan"),
          credits: res.headers.get("x-upgrade-credits"),
          price_aud: res.headers.get("x-upgrade-price-aud"),
          url: res.headers.get("x-upgrade-url"),
        }
      : undefined;
    return {
      error: `HTTP ${res.status}`,
      detail: body,
      ...(upgrade ? { upgrade } : {}),
      // The request id makes a support report actionable instead of anecdotal.
      request_id: res.headers.get("x-request-id") ?? undefined,
      credits,
    };
  }
  return { data: body, credits };
}

const ok = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }] });

const server = new McpServer({ name: "puntersedge", version: VERSION });

/* ─────────────────────────── Racing — the core product ─────────────────────────── */

server.tool(
  "racing_next_to_go",
  "The next Australian horse, greyhound and harness races about to jump, with EVERY bookmaker's " +
    "price for every runner side by side. This is the primary tool: use it for 'what's racing " +
    "next', 'who is favourite in the next race at <venue>', or any question about current " +
    "Australian racing prices. Each race reports data_age_seconds and each price its own age, so " +
    "you can tell the user how fresh the odds are rather than implying they are live to the second.",
  {
    num_races: z.number().int().min(1).max(50).optional()
      .describe("How many upcoming races to return. Default 10."),
    categories: z.string().optional()
      .describe("Comma-separated: horse, greyhound, harness. Omit for all three."),
    country: z.string().optional()
      .describe("ISO country codes, comma-separated, e.g. 'AU' or 'AU,NZ'. Pass AU for Australian " +
        "meetings — about one upcoming race in five is foreign or unlabelled and carries a median " +
        "of ONE bookmaker, which makes price comparison meaningless. AU races carry a median of four."),
    bookmakers: z.string().optional()
      .describe("Comma-separated bookmaker keys to restrict to, e.g. 'sportsbet,tab'."),
  },
  async (a) => ok(await call("/racing/next-to-go", a)),
);

server.tool(
  "racing_best_odds",
  "The single best available price for each runner in upcoming Australian races, and which " +
    "bookmaker is offering it. Use this when the user wants the best price rather than a full " +
    "comparison across every book — 'where is the best odds on <horse>', 'best price in the next race'.",
  {
    num_races: z.number().int().min(1).max(50).optional().describe("How many upcoming races. Default 10."),
    categories: z.string().optional().describe("horse, greyhound, harness — comma-separated."),
    country: z.string().optional().describe("ISO country codes, e.g. 'AU'."),
    bookmakers: z.string().optional().describe("Restrict to these bookmaker keys."),
  },
  async (a) => ok(await call("/racing/best-odds", a)),
);

server.tool(
  "racing_events",
  "The upcoming Australian race schedule — venues, race numbers and jump times, without runner " +
    "prices. Use this for 'what meetings are on today' or to find a race_id before asking about it. " +
    "Cheaper than next_to_go when prices are not needed.",
  {
    hours_ahead: z.number().int().min(1).max(24).optional().describe("Look-ahead window in hours. Default 4."),
    categories: z.string().optional().describe("horse, greyhound, harness — comma-separated."),
    country: z.string().optional().describe("ISO country codes, e.g. 'AU'."),
  },
  async (a) => ok(await call("/racing/events", a)),
);

server.tool(
  "racing_results",
  "Settled results for Australian races that have already run — finishing order and dividends. " +
    "Use this for 'who won the <race> at <venue>' or to check a past result. Not for upcoming races.",
  {
    hours_back: z.number().int().min(1).max(168).optional().describe("How far back to look. Default 24."),
    venue: z.string().optional().describe("Filter to one venue, e.g. 'Randwick'."),
    categories: z.string().optional().describe("horse, greyhound, harness."),
    limit: z.number().int().min(1).max(200).optional().describe("Max races returned."),
  },
  async (a) => ok(await call("/racing/results", a)),
);

server.tool(
  "racing_movers",
  "Runners whose price has moved sharply across the market — firming (shortening) or drifting " +
    "(lengthening). Use this for 'what's being backed', 'any big movers today', or market-sentiment " +
    "questions. A move confirmed by several bookmakers is more meaningful than one book repricing, " +
    "so min_books guards against reading noise as a signal.",
  {
    direction: z.enum(["firming", "drifting"]).optional().describe("Omit for both."),
    min_move_pct: z.number().min(1).max(90).optional().describe("Minimum percentage move. Default 10."),
    min_books: z.number().int().min(1).max(12).optional()
      .describe("How many bookmakers must show the move before it counts. Default 3."),
    categories: z.string().optional().describe("horse, greyhound, harness."),
    country: z.string().optional().describe("ISO country codes, e.g. 'AU'."),
    limit: z.number().int().min(1).max(200).optional().describe("Max runners returned."),
  },
  async (a) => ok(await call("/racing/movers", a)),
);

/* ─────────────────────────────────── Sports ─────────────────────────────────────── */

server.tool(
  "list_sports",
  "Every sport and competition this API currently covers, with its sport_key. Call this FIRST if " +
    "you are unsure of the right sport_key — passing an unknown key returns a 404 listing the valid " +
    "ones, but checking here is cheaper. Note there is no 'horse-racing' sport_key: racing lives " +
    "under the separate racing_* tools.",
  {},
  async () => ok(await call("/sports")),
);

server.tool(
  "get_sports_odds",
  "Head-to-head and other market odds for one sport, from every bookmaker covering it. Use for " +
    "'odds for the <team> game', 'who is favourite in the NRL tonight'. Sports coverage is thinner " +
    "than racing — at most 5 bookmakers on AFL and NRL, 3 on NBA and ATP, and as few as 1 on some " +
    "competitions — so say how many books are quoting rather than implying a full market.",
  {
    sport_key: z.string().describe("From list_sports, e.g. 'afl', 'nrl', 'nba'."),
    markets: z.string().optional().describe("Comma-separated market keys, e.g. 'h2h,totals'."),
    bookmakers: z.string().optional().describe("Restrict to these bookmaker keys."),
    oddsFormat: z.enum(["decimal", "american"]).optional().describe("Default decimal (Australian convention)."),
    maxAgeMinutes: z.number().int().min(1).optional().describe("Drop prices older than this."),
  },
  async ({ sport_key, ...rest }) => ok(await call(`/sports/${encodeURIComponent(sport_key)}/odds`, rest)),
);

server.tool(
  "get_best_odds",
  "The single best price per selection for one sport, and which bookmaker offers it. Use when the " +
    "user wants the best available price rather than every book's line.",
  { sport_key: z.string().describe("From list_sports, e.g. 'afl'.") },
  async ({ sport_key }) => ok(await call(`/best-odds/${encodeURIComponent(sport_key)}`)),
);

/* ─────────────────────────────────── Account ────────────────────────────────────── */

server.tool(
  "account_usage",
  "This API key's credit usage and remaining balance for the month. Use it when a call has been " +
    "refused with a 402, or when the user asks how much of their quota is left.",
  {},
  async () => ok(await call("/usage")),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr, never stdout — stdout is the MCP protocol channel and anything written there
  // corrupts the stream.
  console.error(`puntersedge-mcp ${VERSION} ready (${BASE})${KEY ? "" : " — PUNTERSEDGE_API_KEY not set"}`);
}

main().catch((e) => {
  console.error("puntersedge-mcp failed to start:", e);
  process.exit(1);
});
