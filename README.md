# Local REST API for Obsidian

See our interactive docs: https://coddingtonbear.github.io/obsidian-local-rest-api/

Have you ever needed to automate interacting with your notes?  This plugin gives Obsidian a REST API you can interact with your notes from other tools so you can automate what you need to automate.

This plugin provides a secure HTTPS interface gated behind api key authentication that allows you to:

- Read, create, update or delete existing notes.  There's even a `PATCH` HTTP method for inserting content into a particular section of a note.
- List notes stored in your vault.
- Create and fetch periodic notes.
- Execute commands and list what commands are available.
- Run Dataview searches (DQL or JsonLogic) and now DataviewJS dashboards from outside Obsidian.

This is particularly useful if you need to interact with Obsidian from a browser extension like [Obsidian Web](https://chrome.google.com/webstore/detail/obsidian-web/edoacekkjanmingkbkgjndndibhkegad).

## DataviewJS execution endpoint

`POST /dataviewjs/` lets you run the same DataviewJS snippets you normally execute inside Obsidian. Send the script as-is (for example `dv.list([1, 2, 3])` or `await dv.view("02_Core/Journey_Map/_EXAMPLES/views/signal_source_flow_dashboard", { status: 'active' })`).

### Request formats

Send the code either directly as raw text (`Content-Type: text/plain`) or as JSON:

```json
{
  "code": "dv.list([1, 2, 3])"
}
```

```json
{
  "code": "await dv.view(\"02_Core/Journey_Map/_EXAMPLES/views/signal_source_flow_dashboard\", { status: 'active' })",
  "filePath": "02_Core/Journey_Map/_EXAMPLES/Flows/signal_source_setup.md",
  "timeoutMs": 30000
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `code` | string | Required DataviewJS code (or send it directly as the request body). |
| `filePath` | string | Optional execution context. Defaults to the active file, then the first note in the vault. |
| `timeoutMs` | number | Optional timeout in milliseconds (default 15 s, set `0` to disable). |

### Response shape

```json
{
  "filePath": "Daily/2025-11-08.md",
  "source": {"type": "code"},
  "html": "<div class=\"flow\">…",
  "text": "Signal Source Setup — Flow Overview…",
  "blocks": [
    {"tag": "div", "text": "…", "html": "<div>…</div>", "attributes": {"class": "flow-card"}}
  ]
}
```

Use `html` if you need full rendering, `text` for plain text, or iterate over `blocks` to inspect each top-level element that Dataview produced.

## Credits

This was inspired by [Vinzent03](https://github.com/Vinzent03)'s [advanced-uri plugin](https://github.com/Vinzent03/obsidian-advanced-uri) with hopes of expanding the automation options beyond the limitations of custom URL schemes.
