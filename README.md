# puntersedge-mcp

**Live Australian racing and sports odds inside your AI assistant.**

An [MCP](https://modelcontextprotocol.io) server for the [PuntersEdge AU Odds API](https://puntersedge.online/api-platform).
Ask Claude, ChatGPT, Cursor or any MCP-capable client what's racing next and get real prices from
**12 Australian sources** — 11 bookmakers plus the Betfair Exchange — side by side, with each
price's own age attached.

```
You: What's the next race at Randwick and who's favourite?

→ racing_next_to_go(num_races=3, country="AU")
← Wiesners Maiden Plate R1 — 11 runners, 8 bookmakers, data 38s old
  Favourite: <runner> at $2.40 (sportsbet) / $2.55 (tab) / $2.35 (neds)
```

---

## Install

```bash
npm install -g puntersedge-mcp
```

You need an API key. The **free tier is 1,500 credits/month with no card required** —
[get one here](https://puntersedge.online/api).

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "puntersedge": {
      "command": "npx",
      "args": ["-y", "puntersedge-mcp"],
      "env": { "PUNTERSEDGE_API_KEY": "your_key_here" }
    }
  }
}
```

### Cursor / Windsurf / other MCP clients

Same shape — command `npx`, args `["-y", "puntersedge-mcp"]`, and `PUNTERSEDGE_API_KEY` in the env.

---

## Tools

### Racing — the core of the feed

| Tool | Use it for |
| --- | --- |
| `racing_next_to_go` | The next AU races about to jump, with **every** bookmaker's price per runner. The primary tool |
| `racing_best_odds` | Just the best available price per runner, and who's offering it |
| `racing_events` | The upcoming schedule — venues, race numbers, jump times. No prices, cheaper |
| `racing_results` | Settled results and dividends for races already run |
| `racing_movers` | Runners firming or drifting sharply across the market |

### Sports

| Tool | Use it for |
| --- | --- |
| `list_sports` | Every sport and `sport_key` currently covered — call this first if unsure |
| `get_sports_odds` | Odds for one sport across the bookmakers covering it |
| `get_best_odds` | Best price per selection for one sport |

### Account

| Tool | Use it for |
| --- | --- |
| `account_usage` | Credits used and remaining this month |

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

**Racing: 12 sources** — 11 bookmakers plus the Betfair Exchange: BetRight, Sportsbet, Betr, TAB,
Ladbrokes, Neds, Unibet, PointsBet, PlayUp, TABtouch, Palmerbet and Betfair.

**Depth is uneven, and it matters more than the headline count.** Measured on Australian races
within two hours of jumping: Betfair, BetRight, Sportsbet and Betr quote essentially every race;
TAB about four in five; Ladbrokes and Neds roughly two thirds; then it thins — PointsBet and
Unibet near two in five, TABtouch about one in five, Palmerbet under one in ten. Books also
publish markets at different times, so a race six hours out often carries only two or three
prices where more appear closer to the jump. Every response names the books that actually quoted,
so you can see the real depth per race rather than trusting an average.

**Sports: fewer again.** At most 5 bookmakers on AFL and NRL, 3 on NBA and ATP, and as few as 1
on some competitions. That is a connector-coverage limit, not an outage. Racing is where this
feed is strongest, and the tools say so rather than implying a uniform market.

Pass `country=AU` for racing. Foreign and unlabelled races are quoted by a **single** bookmaker —
every one of them in the window measured, never two — so comparing prices across books on them
compares nothing. Australian races carry around **five**.

How much of the card is foreign swings with the clock rather than sitting at some headline ratio:
near zero through the Australian afternoon, all of it overnight. Filter on `country` rather than
assuming a mix.

---

## Notes

- **Not exposed:** arbitrage and exchange endpoints. Some are withheld pending a Betfair licence
  and return 410 to customer keys, so shipping tools for them would only produce errors.
- **This is data, not advice.** Prices are what bookmakers published; nothing here predicts
  outcomes. Gamble responsibly — [Gambling Help Online](https://www.gamblinghelponline.org.au/),
  1800 858 858.
- **Credit costs** ride on every response in `X-Credits-*` headers and are surfaced in each tool
  result, so an assistant can see the remaining balance without spending a call to find out.

## Links

- [API documentation](https://api.puntersedge.online/docs)
- [Pricing](https://puntersedge.online/api/pricing) — free tier 1,500 credits/month
- [Python SDK](https://github.com/Propertyscout001/puntersedge-python)
- [Postman collection](https://api.puntersedge.online/postman.json) — 36 ready-to-run requests; import into Postman via Import → Link

MIT © PuntersEdge
