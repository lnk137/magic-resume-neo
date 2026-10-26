# Local deployment

The local edition lives at `/Users/lnk137/dev/projects/magic-resume-neo` and runs at
<http://127.0.0.1:3210>. The source and upstream license are retained.

## Production service

macOS LaunchAgent: `local.lnk137.magic-resume-neo`.

- Configuration: `~/Library/LaunchAgents/local.lnk137.magic-resume-neo.plist`
- Logs: `~/Library/Logs/magic-resume-neo/server.log` and `server-error.log`
- Starts at login and restarts if the process exits; closing a terminal does not stop it.
- Listens on loopback only. The computer must remain awake for access.
- `AI_PROXY_URL=http://127.0.0.1:7897` is used for providers requiring a proxy.

```sh
# Build after changing source
cd /Users/lnk137/dev/projects/magic-resume-neo
pnpm install --frozen-lockfile
pnpm build

# Restart the deployed service after a successful build
launchctl kickstart -k gui/$(id -u)/local.lnk137.magic-resume-neo

# Inspect status
launchctl print gui/$(id -u)/local.lnk137.magic-resume-neo

# Stop until the next login or bootstrap
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/local.lnk137.magic-resume-neo.plist

# Register again after stopping
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/local.lnk137.magic-resume-neo.plist
```

The tracked pnpm build policy allows esbuild, sharp and the native file watcher.
Puppeteer browser downloads and unused Workers installation scripts are disabled;
this deployment uses the Node server, not Cloudflare Workers.

## Existing resumes and AI settings

Browser storage is isolated by origin. Resumes saved on `magicv.art` will not
appear automatically on `127.0.0.1:3210`. Export JSON from the original site and
import it in the local dashboard. Keep the JSON backup until the import is verified.

AI model/provider settings are configured in the local app. They are not copied
from the hosted site and are not stored in Git. MCP uses a separate local connection;
see [MCP integration](mcp.md).
