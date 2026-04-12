# Manual Tests

These tests exercise features that need a real HTTP server (workers, sockets, eventsource)
and can't run in the normal Playwright test suite.

## Workers

Workers need the library served at a URL (for `importScripts`).

```sh
# from the project root
npx serve .
# then open http://localhost:3000/test/manual/workers.html
```

## Sockets & EventSource

These need live WebSocket and SSE endpoints.

```sh
# requires the `ws` package: npm install ws
node test/manual/server.js
# then open http://localhost:3000/test/manual/connections.html
```

The server provides:
- `GET /sse` - SSE stream: one `message` event, five `tick` events (JSON), one `done` event
- `GET /sse-named` - SSE stream: `greeting` and `farewell` events (JSON)
- `WS /ws` - WebSocket: echo + RPC (`add`, `greet`, `failPlease`)

Both pages run tests automatically and show pass/fail results.
