---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Networking {#networking}

Hyperscript is primarily designed for front end scripting, local things like toggling a class on a div and so on,
and is designed to pair well with [htmx](https://htmx.org), which uses a hypermedia approach for interacting with
servers.

Broadly, we recommend that approach: you stay firmly within the original REST-ful model of the web, keeping things
simple and consistent, and you can use hyperscript for small bits of front end functionality.  htmx and hyperscript
integrate seamlessly, so any hyperscript you return to htmx will be automatically initialized without any additional
work on your part.

### Fetch {#fetch}

However, there are times when calling out to a remote server is useful from a scripting context, and hyperscript
supports the [`fetch` command](/commands/fetch) for doing so:

{% example "Issue a Fetch Request" %}
<button _="on click fetch /clickedMessage then
                    put the result into the next <output/>">
  Fetch It
</button>
<output>--</output>
{% endexample %}

The fetch command uses the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and allows you
configure the fetch as you want, including passing along headers, a body, and so forth.

Additionally, you may notice that the `fetch` command, in contrast with the `fetch()` function, does not require
that you deal with a Promise.   Instead, the hyperscript runtime deals with the promise for you: you can simply
use the `result` of the fetch as if the fetch command was blocking.

This is thanks to the [async transparency](/docs/async/) of hyperscript.

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

<div class="docs-page-nav">
<a href="/docs/getting-around/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Getting Around</strong></a>
<a href="/docs/advanced/" class="next"><strong>Advanced</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
