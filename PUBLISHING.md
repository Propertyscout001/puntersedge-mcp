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
