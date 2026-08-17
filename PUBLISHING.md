# Publishing checklist

Everything that does not need a credential is **done**. Two steps remain, both requiring an
account only the operator holds.

## State right now

- [x] Code written, builds, 9 tools verified over the MCP protocol against live data
- [x] Public GitHub repo, topics, homepage — https://github.com/Propertyscout001/puntersedge-mcp
- [x] `prepare` script so `npm install git+https://...` builds `dist/`
- [x] `mcpName` in package.json = `io.github.propertyscout001/puntersedge`
- [x] `server.json` written and **validated clean** by the official `mcp-publisher validate`
- [x] Names confirmed free: npm `puntersedge-mcp` (404) and MCP registry `puntersedge` (0 hits)
- [ ] **npm publish** — needs an npm account
- [ ] **mcp-publisher login + publish** — needs a GitHub browser device-code approval

## Why npm must come first

> "The MCP Registry only hosts metadata, not artifacts, so we must publish the package to npm
> before publishing the server to the MCP Registry."
> — the official quickstart

Submitting to the registry before npm produces an entry pointing at a package that does not
exist. The registry also verifies ownership by reading `mcpName` back out of the **published**
npm package, so it cannot succeed beforehand.

## Step 1 — npm

```bash
cd ~/puntersedge-mcp
npm login            # your npm account
npm publish --access public
```

`prepublishOnly` runs `tsc` first, so `dist/` is built and included. Verify at
https://www.npmjs.com/package/puntersedge-mcp

## Step 2 — MCP Registry

```bash
cd ~/puntersedge-mcp
./mcp-publisher login github     # opens a device-code flow in your browser
./mcp-publisher publish
```

The GitHub account must be **Propertyscout001**, because the namespace
`io.github.propertyscout001/` is what proves ownership.

Confirm with:

```bash
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=puntersedge" | python3 -m json.tool
```

## Step 3 — the aggregators, afterwards

Glama, mcp.so and PulseMCP largely **crawl** the official registry and GitHub topics rather
than taking manual submissions, so they tend to pick a server up on their own once steps 1 and
2 are done. The repo already carries the topics they index (`mcp`, `mcp-server`,
`model-context-protocol`). Check back a few days later rather than submitting anywhere blind.

## Version bumps

`package.json` version, `server.json` version, and `server.json` packages[0].version must all
match, or the publish is rejected. Bump all three together.


---

## ⚠️ PARKED 2026-08-17 — read this before retrying

Everything except the npm publish is done. **Do not repeat the token roulette**; four attempts
failed for the same reason.

### What blocks it

The npm account `puntersedge01` **enforces 2FA for publishing**. Every attempt returned:

    PUT 403 — Two-factor authentication or granular access token with
    bypass 2fa enabled is required to publish packages.

### What does NOT work

| Attempt | Result |
| --- | --- |
| Web login (`npm login`) | Authenticates (`whoami` works) but publish 403s — no OTP challenge |
| Classic **Publish** token | Same 403. It authenticates but cannot satisfy 2FA |
| A placeholder pasted literally | `_authToken=YOUR_TOKEN` sat in ~/.npmrc; publish 404'd |

**Diagnostic that settles it in one command:** `npm token list` lists **classic tokens only**.
If your new token appears there, it is classic and will fail. A granular token never appears and
is ~67-72 chars; classic is 40. Check the length before trying to publish.

### What WILL work

Either of these:

```bash
# A. Interactive — no token involved, prompts for the authenticator code
cd ~/puntersedge-mcp
npm login --auth-type=legacy      # username, password, OTP
npm publish --access public
```

```bash
# B. Granular token — must be created from the "Granular Access Token" button
#    (NOT "Classic Token"), with Read AND write, and "Bypass 2FA" ticked
npm config set //registry.npmjs.org/:_authToken=<the ~70-char npm_ value>
npm whoami                        # must print puntersedge01
npm publish --access public
```

Then, unchanged and already prepared:

```bash
npm view puntersedge-mcp version  # must print 0.1.0
./mcp-publisher publish           # already logged in; namespace casing already fixed
```

### State when parked

- Repo public, installable **today** via `npx github:Propertyscout001/puntersedge-mcp`
- `server.json` validates clean against the live registry
- Namespace `io.github.Propertyscout001/puntersedge` — case-sensitive, matches package.json
- `~/.npmrc` holds a **revoked** token; it must be replaced, not reused
- Nothing is half-published: npm has no `puntersedge-mcp`, the registry has no entry
