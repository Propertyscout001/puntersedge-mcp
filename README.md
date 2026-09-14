# Australian Racing and Sports Odds MCP Server

**A Model Context Protocol server for Australian horse racing, greyhound, harness and sports
odds.** Point Claude Desktop, Claude Code, Cursor, Windsurf or any MCP client at a live
Australian odds feed and ask it what is racing next, what every bookmaker is paying, which
runners are firming, and who won.

Racing data MCP · sports odds MCP server · horse racing MCP server · Australian odds for
Claude · sports data for Cursor.

```
You: What's the next race at Randwick and who's favourite?

→ racing_next_to_go(num_races=3, country="AU")
← Wiesners Maiden Plate R1 — 11 runners, 8 bookmakers, data 38s old
  Favourite: <runner> at $2.40 (sportsbet) / $2.55 (tab) / $2.35 (neds)
```

14 Australian bookmakers on racing. AU thoroughbred, greyhound and harness; NZ thoroughbred
and harness. AFL, NRL, NBA, NFL, tennis, cricket and more on sports. Free tier: 1,500 credits
a month, no card.

---

## There are two PuntersEdge MCP servers. You probably want the Python one.

Being straight about this, because the difference is large.

| | **`puntersedge-mcp` on PyPI (Python)** | **This repo (TypeScript)** |
|---|---|---|
| Tools | **26** | 9 |
| Credit cost stated per tool | **yes, all 26** | no |
| Works before you have an API key | **yes** — two keyless demo tools | no |
| Form, premierships, closing lines, track conditions, feed health | **yes** | no |
| Install | `uvx puntersedge-mcp` | `npx -y github:Propertyscout001/puntersedge-mcp` |
| Docs | https://puntersedge.online/developers/mcp-server | this file |

**If you just want the odds inside your assistant, use the Python server.** It is the fuller
server, it is the one the documentation describes, and it will show you live prices before you
sign up for anything.

This TypeScript server is a smaller, dependency-light implementation of the five core racing
tools and four sports tools. It is real and it works — the install below is verified — but it
is a subset.

<details>
<summary>Python server config, if you came here for that</summary>

```json
{
  "mcpServers": {
    "puntersedge": {
      "command": "uvx",
      "args": ["puntersedge-mcp"],
      "env": { "PUNTERSEDGE_API_KEY": "your_key_here" }
    }
  }
}
```

Full instructions: https://puntersedge.online/developers/mcp-server?utm_source=github&utm_medium=readme

</details>

---

## Install this server

Not published to npm. There is **no** npm package called `puntersedge-mcp` — install straight
from this repo, which builds itself on install:

```bash
npx -y github:Propertyscout001/puntersedge-mcp
```

First run clones the repo and compiles it with `tsc`, so it takes a while and needs `git` plus
a working Node toolchain. Node ≥18.

Get a free API key at https://puntersedge.online/api?utm_source=github&utm_medium=readme —
1,500 credits a month, no credit card.

### Claude Desktop

Edit `claude_desktop_config.json`, then fully quit and reopen Claude Desktop:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "puntersedge": {
      "command": "npx",
      "args": ["-y", "github:Propertyscout001/puntersedge-mcp"],
      "env": { "PUNTERSEDGE_API_KEY": "your_key_here" }
    }
  }
}
```

### Claude Code

One command, from the project directory:

```bash
claude mcp add puntersedge \
  -e PUNTERSEDGE_API_KEY=your_key_here \
  -- npx -y github:Propertyscout001/puntersedge-mcp
```

Add `-s user` to make it available in every project instead of just this one. Claude Code
writes project servers to `.mcp.json` in the project root, which you can commit and edit by
hand — keep the key out of it and use an environment variable if you do.

### Cursor

`.cursor/mcp.json` for one project, `~/.cursor/mcp.json` for all of them:

```json
{
  "mcpServers": {
    "puntersedge": {
      "command": "npx",
      "args": ["-y", "github:Propertyscout001/puntersedge-mcp"],
      "env": { "PUNTERSEDGE_API_KEY": "your_key_here" }
    }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json` — same `mcpServers` shape as Cursor.

### VS Code / GitHub Copilot

`.vscode/mcp.json` in the workspace. VS Code uses a `servers` key rather than `mcpServers`:

```json
{
  "servers": {
    "puntersedge": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:Propertyscout001/puntersedge-mcp"],
      "env": { "PUNTERSEDGE_API_KEY": "your_key_here" }
    }
  }
}
```

### Anything else

Any host that accepts a stdio server takes the same three facts: a command, its arguments, and
an env block carrying `PUNTERSEDGE_API_KEY`. Keep the key in the environment, not in a prompt —
the server reads it once at start-up and never echoes it in a tool result.

---

## Tools

Nine tools, all read-only. Costs are in API credits and are what the API bills for the
underlying endpoint — they are not this server's invention. Figures below were read from
https://api.puntersedge.online/openapi.json on 2026-09-15.

### Racing

| Tool | What it returns | Cost |
|---|---|---|
| `racing_next_to_go` | The next AU races about to jump, with **every** bookmaker's price per runner. The primary tool. | 2 credits |
| `racing_best_odds` | Just the best available price per runner, and which book is offering it. | 3 credits |
| `racing_events` | The upcoming schedule — venues, race numbers, jump times. No prices, so cheaper. | 1 credit |
| `racing_results` | Settled results and dividends for races already run. | 2 credits |
| `racing_movers` | Runners firming or drifting sharply across the market. `min_books` guards against reading one book's reprice as a market move. | 3 credits |

### Sports

| Tool | What it returns | Cost |
|---|---|---|
| `list_sports` | Every sport and `sport_key` currently covered. Call this first if unsure. | 1 credit |
| `get_sports_odds` | Odds for one sport across the bookmakers covering it. | **1 credit per market requested** — `h2h` is 1, `h2h,spreads,totals` is 3 |
| `get_best_odds` | Best price per selection for one sport. | 3 credits |

### Account

| Tool | What it returns | Cost |
|---|---|---|
| `account_usage` | Credits used and remaining this month. | free |

Every response also carries the live `X-Credits-*` headers through to the tool result, so an
assistant can read its remaining balance without spending a call to find out. A `402` means the
monthly allowance is spent — a hard stop, no overage billing — and the tool result says so
rather than failing quietly.

**There is no `horse-racing` sport key.** Racing lives under the `racing_*` tools. Passing
`sport_key="horse-racing"` to a sports tool is an error.

---

## What an assistant can and cannot do with this

Worth being explicit, because "betting odds" and "AI agent" in one sentence invites the wrong
assumption.

**It can:**

- read a live odds feed — current per-bookmaker prices, the upcoming schedule, settled results,
  and which runners are firming or drifting
- tell you how fresh each number is, per price, not per page
- state what each call costs in credits before it makes it, and report the balance after

**It cannot:**

- **place a bet.** There is no tool here that places, stakes, cancels or settles anything. Every
  tool is an HTTP GET against a read-only endpoint.
- **hold or use bookmaker credentials.** This server has no bookmaker account, no login, no
  session with any bookmaker. It reads published prices. The only secret it touches is your
  PuntersEdge API key, read from the environment and never written to a tool result.
- **change your PuntersEdge account.** Key rotation, billing and webhook registration are all
  deliberately left out, so a chat turn cannot rotate your credentials, change what you are
  billed, or register a URL that then receives your data. Those endpoints exist; reach them from
  application code or the dashboard, on purpose.
- **predict a result.** Prices are what bookmakers published. Nothing here forecasts outcomes,
  rates a runner, or tells you what to back.

**It will sometimes be wrong about the market, and the data says so.** A stalled scraper does
not error — it keeps serving its last value, which looks exactly like a live price. Every quote
carries its own `age_seconds` and a `stale` flag for that reason. A large apparent edge on a
market only one bookmaker is quoting is a data artefact, not an opportunity; check how many
books stand behind a price before treating a gap as real.

---

## What comes back

Racing responses carry the full market per runner:

```json
{
  "race_name": "Wiesners Maiden Plate", "race_number": 1, "venue": "...",
  "category": "horse", "country": "AU", "distance_m": 1200,
  "track_condition": "...", "weather": "...", "places_paid": 3,
  "data_age_seconds": 38, "stale": false, "stale_bookmakers": [],
  "scratchings": [],
  "runners": [{
    "name": "...", "number": 1, "barrier": 4,
    "jockey": "...", "trainer": "...", "weight": 58.0, "form": "11521",
    "bookmakers": [
      { "key": "tabtouch", "win_price": 126.0, "place_price": 12.0,
        "tote_win": {"PROV": 60.6}, "last_update": "2026-08-17T02:55:3...",
        "source_url": "https://www.tabtouch.com.au/racing/..." }
    ]
  }]
}
```

**Every response tells you its own age.** `data_age_seconds` is race-level, each bookmaker entry
carries its own `last_update`, and `stale_bookmakers` names the specific legs that have gone
quiet rather than condemning the whole race. That matters when an assistant is about to state a
price as fact — it can say how fresh the number is instead of implying it is live to the second.

---

## Coverage, stated honestly

**Racing: 14 Australian bookmakers** — BetRight, Sportsbet, Betr, TAB, Ladbrokes, Neds,
Unibet, PointsBet, NextBet, TABtouch, Palmerbet, BetDeluxe, BetGold and BoostBet. The live count
and per-book freshness are published at
https://puntersedge.online/coverage-report?utm_source=github&utm_medium=readme.

**Betfair and Pinnacle are not in this feed.** The Betfair Exchange is ingested but its prices
are withheld from customer responses pending a Betfair data licence, so it is not counted above
and you will never see a Betfair price through this server. If you need exchange prices, this is
not the feed for you.

Bookmaker **keys** in the API are not always the brand: NextBet is returned as `playup`, its
name before rebranding. Filter on the key, not the display name.

**Near the jump, coverage is broad and fairly even.** Measured over 13 days of captured
snapshots — 3,339 Australian races, each within 30 minutes of jumping — every one of the
fourteen sources quoted between 75% and 97% of them: TABtouch 97%, PointsBet 96%, then
Sportsbet, Neds, Palmerbet, Ladbrokes, BetRight, Betr and TAB all clustered at 80–82%,
Unibet 79% and NextBet 75%.

Books publish markets at different times, so a race several hours out often carries only two or
three prices where more appear closer to the jump. Every response names the books that actually
quoted, so you can read the real depth per race rather than trusting an average.

**Sports: fewer again.** At most 5 bookmakers on AFL and NRL, 3 on NBA and ATP, and as few as 1
on some competitions. That is a connector-coverage limit, not an outage. Racing is where this
feed is strongest, and the tools say so rather than implying a uniform market.

Pass `country=AU` for racing. **87% of foreign and unlabelled races carry exactly one
bookmaker**, so there is usually nothing to compare — but "usually" is the honest word: over the
same 13 days, 10% carried two books and a small tail (about 3%) carried eleven. Check
`bookmakers` per race rather than assuming either way.

An Australian race **gathers books as it approaches the jump**, so its depth is a range, not a
number. Measured 2026-08-17: a median of **10** bookmakers inside 30 minutes of the jump, 9 at
30–60 minutes, 5 at one to two hours, and 2 beyond that. `racing_next_to_go` returns imminent
races, so it sits at the deep end of that range — which is why a headline average across the
whole feed understates what you actually get back.

How much of the card is foreign swings with the clock rather than sitting at some headline ratio:
near zero through the Australian afternoon, all of it overnight. Filter on `country` rather than
assuming a mix.

---

## Notes

- **Not exposed:** arbitrage and exchange endpoints. Some are withheld pending a Betfair licence
  and return 410 to customer keys, so shipping tools for them would only produce errors.
- **This is data, not advice.** Prices are what bookmakers published; nothing here predicts
  outcomes, and nothing here places a bet.
- **Endpoints and parameters were enumerated from the live `openapi.json`**, not from memory.

## Links

- [MCP server documentation](https://puntersedge.online/developers/mcp-server?utm_source=github&utm_medium=readme)
- [API documentation](https://api.puntersedge.online/docs)
- [Pricing](https://puntersedge.online/api/pricing?utm_source=github&utm_medium=readme) — free tier 1,500 credits/month
- [Live coverage report](https://puntersedge.online/coverage-report?utm_source=github&utm_medium=readme)
- [Python SDK](https://github.com/Propertyscout001/puntersedge-python)
- [Postman collection](https://api.puntersedge.online/postman.json) — import into Postman via Import → Link

---

18+ only. Gambling can be addictive — please gamble responsibly.
Gambling Help: **1800 858 858**, or [Gambling Help Online](https://www.gamblinghelponline.org.au/).

MIT © PuntersEdge
