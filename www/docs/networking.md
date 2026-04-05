---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Networking {#networking}

Hyperscript is primarily designed for front end scripting: local things like toggling a class on a div.

It is designed to pair well with [htmx](https://htmx.org), which uses the 
[hypermedia approach](https://hypermedia.systems/hypermedia-a-reintroduction/) for interacting with
servers.

### Fetch {#fetch}

There are times, however, when calling out to a remote server is useful from a scripting context, and hyperscript
supports the [`fetch` command](/commands/fetch) for doing so:

{% example "Issue a Fetch Request" %}
<button _="on click fetch /clickedMessage then
                    put the result into the next <output/>">
  Fetch It
</button>
<output>--</output>
{% endexample %}

The fetch command uses the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and allows you to
configure the fetch as you want, including passing along headers, a body, and so forth.

Notice that the `fetch` command is (or at least appears) synchronous: you make the call then deal with the results.\
in an natural way without `await` or call backs.

This is hyperscript's [async transparency](/docs/async/) at work!

#### Request Options {#fetch-options}

Pass HTTP method, headers, body, and other options with the `with` clause. These map to the
second argument of the browser's [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) API:

  ~~~ hyperscript
  fetch /api/users with method:"POST", body:"name=Joe"
  fetch /api/me with headers:{Authorization:`Bearer ${token}`} as JSON
  ~~~

Forms can be serialized and posted directly using the `as FormData` conversion:

  ~~~ hyperscript
  fetch /api/submit with method:"POST", body:(<form/> as FormData)
  ~~~

See the [`fetch` command](/commands/fetch) for the full list of options.

#### Response Types {#fetch-as}

By default the response body is returned as a string. You can change this with the `as` modifier:

| Form | Result |
|------|--------|
| _(no `as`)_ | Response body as a string |
| `as Text` | Same as the default — response body as a string |
| `as JSON` | Parse the body as JSON and return the resulting object |
| `as HTML` | Parse the body as HTML and return a `DocumentFragment` |
| `as Response` | Return the raw [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) object; you handle body parsing and errors yourself |
| `as <Conversion>` | Apply any registered [conversion](/expressions/as) to the response text (e.g. `as Int`, `as Fragment`) |

#### Error Handling {#fetch-errors}

By default, `fetch` throws on non-2xx responses (404, 500, etc.), matching the behavior
of most modern HTTP libraries. You can catch the error with a `catch` block:

  ~~~ hyperscript
  on click
    fetch /api/users as JSON
    set $users to the result
  catch e
    log "fetch failed:", e
  end
  ~~~

The thrown error carries `response` and `status` properties.

If you want to pass through non-2xx responses without throwing, add `do not throw`
(or `don't throw`):

  ~~~ hyperscript
  fetch /api/users as JSON do not throw
  -- result contains whatever the server sent, even on 404
  ~~~

The `as Response` form never throws on status codes — you get the raw `Response` object:

  ~~~ hyperscript
  fetch /api/users as Response
  if it's ok
    set $users to it as JSON
  end
  ~~~

#### Customizing Error Handling

To customize which status codes throw you can set the `_hyperscript.config.fetchThrowsOn` property to an
array of regex patterns tested against the stringified status code. The default is
`[/4.*/, /5.*/]` (all 4xx and 5xx). Set it to `[]` to disable throwing entirely.

### Server-Sent Events {#eventsource}

The [EventSource extension](/features/eventsource) connects to a
[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) endpoint and lets you
handle server-pushed messages declaratively:

  ~~~ html
  <script type="text/hyperscript">
    eventsource ChatStream from /events
      on message put it into #messages
    end
  </script>
  ~~~

This is an extension that ships with hyperscript and needs to be included separately.

### WebSockets {#socket}

The [Socket extension](/features/socket) provides WebSocket support for real-time, bidirectional
communication:

  ~~~ html
  <script type="text/hyperscript">
    socket ChatSocket ws://localhost:8080
      on message put it into #chat
    end
  </script>
  ~~~

You can send messages to the socket too:

  ~~~ hyperscript
  send "hello" to ChatSocket
  ~~~

Like EventSource, this is a separate extension that ships with hyperscript.

### Intercepting Requests {#intercept}

The [Intercept extension](/features/intercept) lets you declare caching strategies for your app
without writing service worker boilerplate. Under the hood it registers a service worker that
handles caching, offline support, and request interception according to your rules:

  ~~~ html
  <script type="text/hyperscript">
    intercept /
      precache /, /style.css, /app.js as "v1"
      on /api/* use network-first
      on *.css, *.js use cache-first
      on * use stale-while-revalidate
      offline fallback /offline.html
    end
  </script>
  ~~~

The `intercept` scope controls which URLs the service worker handles (`intercept /` covers
the whole site). Each `on <pattern> use <strategy>` rule matches request paths against a glob
pattern and applies a caching strategy:

- **cache-first** — try cache, fall back to network (good for static assets)
- **network-first** — try network, fall back to cache (good for APIs and HTML pages)
- **stale-while-revalidate** — serve from cache, update in the background
- **cache-only** / **network-only** — self-explanatory

Only GET requests are cached. This is a separate extension that ships with hyperscript.

<div class="docs-page-nav">
<a href="/docs/async/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Async Transparency</strong></a>
<a href="/docs/getting-around/" class="next"><strong>Getting Around</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
