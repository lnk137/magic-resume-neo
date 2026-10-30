# Magic Resume Neo MCP

MCP lets Codex or another compatible AI client read and edit the resumes in an explicitly connected **local browser**. Start the deployed app at <http://127.0.0.1:3210>, open the **MCP** pill, then choose **允许 AI 访问此浏览器**. Keep that browser tab open. Disconnect stops access; reloading requires a new connection.

The `magic-resume-neo` stdio server is already registered with Codex on this machine. Start a new Codex chat or restart the client if newly registered tools are not yet visible. Each browser has separate localStorage: resumes on magicv.art are not automatically available locally. Export JSON from the original site and import it into the local app first.

## Other MCP clients

Use your installed Node executable and the absolute project path:

```json
{
  "mcpServers": {
    "magic-resume-neo": {
      "command": "/opt/homebrew/bin/node",
      "args": ["/Users/lnk137/dev/projects/magic-resume-neo/mcp/server.mjs"],
      "env": { "MAGIC_RESUME_URL": "http://127.0.0.1:3210" }
    }
  }
}
```

Codex CLI equivalent:

```sh
codex mcp add magic-resume-neo -- /opt/homebrew/bin/node /Users/lnk137/dev/projects/magic-resume-neo/mcp/server.mjs
```

`pnpm mcp` also starts the stdio server. Do not paste its token into chat. The production app generates `.cache/mcp-token` with file permissions `0600`; the stdio process reads that file automatically. For a custom checkout/port, set `MAGIC_RESUME_URL` and optionally `MAGIC_RESUME_TOKEN_FILE`. MCP browser routes are provided by `pnpm start` (`server.mjs`), not bare Vite dev mode. The deployed web server defaults to `127.0.0.1`; MCP routes reject non-loopback requests and foreign origins even if the main web app is configured to listen elsewhere.

## Tools

| Scope | Tools |
| --- | --- |
| Discover/read | `resume_sessions`, `resume_list`, `resume_read`, `resume_schema` |
| Resume lifecycle | `resume_create`, `resume_duplicate`, `resume_delete`, `resume_update` |
| Portable JSON | `resume_export`, `resume_import` |
| Modules | `module_create`, `module_update`, `module_delete`, `module_reorder` |
| Items | `item_create`, `item_update`, `item_delete`, `item_reorder` |
| Recovery | `resume_undo`, `resume_audit` |

`resume_schema` lists current templates, typography, colors and item options. `resume_update` merges basic fields and global styles, sets templates, and edits skills/self evaluation HTML. Use item tools for education, experience, projects, publications, certificates and custom modules. Use `module_update` to rename a module or change its visibility. Built-in modules can be hidden; custom modules can be deleted. All text color roles and stable field color paths are editable; set an optional color property to `null` to restore inheritance.

Every mutation requires the exact `expected_revision` returned by the latest read. If a person types while AI is working, a stale operation is rejected. With multiple connected browsers, use `session_id` from `resume_sessions`. Changes update the active preview and browser localStorage before success is returned. Import always creates a new resume and never overwrites an existing one.

Example request sequence:

1. `resume_list` → select the resume id and revision.
2. `resume_read` → inspect existing facts, modules and item ids.
3. `resume_update` with `{ "resume_id": "…", "expected_revision": "…", "data": { "basic": { "name": "张三" }, "globalSettings": { "textColors": { "body": "#243247" } } } }`.
4. Read again to obtain the new revision before another edit.

Suggested prompt: “读取我的简历，把姓名改成深蓝色，为比赛经历新增一个条目，只使用我提供的事实，保留其他内容。”

## Persistence, recovery and limits

Resumes remain browser-local; the server keeps paired snapshots in memory, without writing resume content to disk. Idle heartbeat requests omit snapshots; a new snapshot is sent only after data or active selection changes. GitHub tokens (`basic.githubKey`) never cross the bridge and are immutable to MCP. Rich text is normalized through a DOM tag/style/link allowlist; executable HTML, malformed field types and invalid colors/layout options are rejected or stripped before persistence.

`resume_undo` stores up to 30 prior MCP snapshots in the connected browser's memory. It can undo creation and deletion but refuses to overwrite subsequent manual edits. Disconnect/reload clears MCP undo; normal editor history remains separate. `resume_audit` holds the last 100 command outcomes in server memory, containing action/id/time/success metadata, not resume content. The browser and server must both remain online. Snapshots are limited to 32 MB; very large embedded images should be resized or exported separately. Browser localStorage capacity can be smaller; failed persistence is reported as an error and the in-memory edit is rolled back.

After an acknowledgement timeout, read the current resume before retrying: the browser may already have applied the change. If the browser is offline, no background/disk edits are silently queued. Sessions are considered offline after 15 seconds without a heartbeat; at most 10 browser pairings are retained, with stale pairings removed after an hour. A server restart requires reconnecting the browser.

Edits to an existing resume use the normal store update path (and its configured folder sync). MCP deletion/undo operate on browser storage; they do not remove or restore separate exported JSON files. Keep JSON exports for backups beyond the current browser session.

## Verification

```sh
pnpm test:mcp
# With Vite dev server running at :3211, the test starts its own isolated local bridge/proxy:
node --test tests/mcp.browser.mjs
```

The integration test uses the official SDK client over stdio, verifies authenticated pairing, real command acknowledgement, stale revision rejection and offline errors. The browser test verifies live editing, JSON persistence, reload, safe rich text, custom module/item creation and guarded undo using an isolated browser profile.

SDK implementation follows the [official MCP TypeScript SDK v1 server documentation](https://ts.sdk.modelcontextprotocol.io/server) and [transport security requirements](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports). The app ships the stable `@modelcontextprotocol/sdk` package; no LLM provider key is required to run this MCP server.

Custom module `title`, `subtitle`, `dateRange` now represent free-form **left / center / right** content, not a required date range. `item_update` accepts `fieldBold: { title: false, subtitle: true, dateRange: true }` to set independent emphasis. These optional properties preserve compatibility with older resumes and JSON backups.
