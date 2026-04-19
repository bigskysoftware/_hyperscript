---
title: eventsource - ///_hyperscript
---

## The `eventsource` Feature

The `eventsource` feature gives you a declarative way to work with [Server Sent Events](https://en.wikipedia.org/wiki/Server-sent_events). You define handlers for named events right inside the declaration, and hyperscript manages the connection lifecycle -- including automatic reconnection -- for you.

### Installing

The `eventsource` feature is an extension and must be included separately, *after* hyperscript itself:

```html
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.91/dist/_hyperscript.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.91/dist/ext/eventsource.min.js"></script>
```

Or if you're using npm: `import 'hyperscript.org/dist/ext/eventsource.js'` after importing hyperscript.

SSE connections can require substantial work to set up and maintain. For example, browsers are supposed to reconnect to a failed SSE stream automatically, but their behavior differs. Hyperscript manages everything for you, and reconnects connections that have failed, so your code only has to handle incoming messages.

```hyperscript
eventsource ChatUpdates from http://myserver.com/chat-updates

  on newMessage as JSON
    log it
  end

  on updateMessage as JSON
    log it
  end

end
```

#### About Event Names

Event handlers match by name.  Use `on "message"` to catch unnamed events (where the server sends no `event:` field).

Wildcard patterns are supported using `*`:

```hyperscript
eventsource Feed from /events
  on "user.*" as json     -- matches user.login, user.logout, etc.
    log it
  end
  on "*" as json           -- catch-all for any named event
    log it
  end
  on "message"             -- unnamed events only
    log it
  end
end
```

The `*` character matches any sequence of characters.  Exact matches take no priority over wildcards - all matching handlers fire.

#### Decoding Messages

You can specify two different ways to decode the message contents. If you include `as string` in the message handler declaration, then the contents of the message will be populated in the handler exactly as they were sent, as a string.

Instead, if you specify `as JSON`, then hyperscript will parse the message as a JSON formatted string. If the data is not valid JSON, then it will throw an error.

If you do not specify any encoding, then hyperscript will pass the original data through unmodified.

### Connection Options

Options are specified with `with` after the URL.  Multiple options can be chained:

```hyperscript
eventsource Feed from /api/stream with credentials with method "POST" with headers {"Authorization": "Bearer abc"}
    on "update" as json
        log it
    end
end
```

#### `with credentials`

Sets `credentials: 'include'` on the fetch request, allowing cookies and auth headers on cross-origin connections.

#### `with method`

Sets the HTTP method.  Default is `GET`.  Use `"POST"` to send a request body when establishing the connection.

#### `with headers`

Merges additional headers into the fetch request.  The value is an object literal.

### Connection Lifecycle Events

The eventsource generates `open`, `close`, and `error` events that you can handle like any other event:

```hyperscript
eventsource demo from http://server/demo

    on message as string
        put it into #div
    end

    on open
        log "connection opened."
    end

    on close
        log "connection closed."
    end

    on error
        log "handle error here..."
    end

end
```

### The EventSource Variable

When you define an event source, it places a stub variable inside the current scope. This variable stores the raw EventSource object provided by the browser, tracks connection retries, and publishes two useful methods that you can use within hyperscript (see below for an example):

- `open(url?)` connects to the EventSource. If the EventSource already has a URL configured, then this function doesn't require any additional parameters. However, if the EventSource does not already have a URL, then you must pass one here before it can open. If the connection has already been opened, then no further action is taken.
- `close` disconnects from the configured server address. If the connection has already been closed, then no further action is taken.

You can also listen to events from this variable in other parts of your hyperscript code.

```hyperscript

-- define the SSE EventSource
eventsource UpdateServer from http://server/updates
    on message
        log it
    end
end

-- elsewhere in your code, listen for the "cancelGoAway" message, then disconnect
on cancelGoAway from UpdateServer
    log "received cancel message from server"
    call UpdateServer.close()
end
```

### Dynamic Server Connections

You may need to change the server URL that your EventSource is connected to. You can do this at any time by calling the `open(url)` method on the EventSource variable. You can also initialize all of the handlers for an EventSource in your hyperscript application without connecting it to any server at all.

Calling the `open()` method repeatedly will close out any old connections and create a new connection on the updated URL.

```hyperscript
eventsource DynamicServer
    on message as JSON
        log it
    end
end

-- somewhere else in your code
DynamicServer.open("test.com/test1.sse") -- creates a new connection to this URL

DynamicServer.open("test.com/test2.sse") -- automatically closes the first connection
DynamicServer.close()

DynamicServer.open("test.com/test3.sse") -- reconnects to a different endpoint.
```

#### Other Values Available To SSE Event Handlers

The following variables are populated within the event handler's scope when it is executed:

- `me` is a reference to the EventSource object. Additional data and methods are also available. Outside of the event handler, this object is also available under the \<source-name\> provided.
- `it` is the contents of the SSE message that was received.
- `event` contains the raw event data.

### Examples

#### Updating Records In Real-Time

```html
<script type="text/hyperscript">
  eventsource recordUpdater from http://server-name/record-updater

      on message as JSON
          put it.name into #name
          put it.username into #username
          put it.email into #email
          log me
      end

  end
</script>

<div>
  <button script="on click call recordUpdater.open()">Connect</button>
  <button script="on click call recordUpdater.close()">Disconnect</button>
</div>

<h3>Real-Time Record</h3>
<div>Name: <span id="name">...</span></div>
<div>Username: <span id="username">...</span></div>
<div>Email: <span id="email"></span></div>
```

### Reconnection

When a connection drops, hyperscript automatically reconnects with exponential backoff.  If the server sends a `retry:` field, the base delay is updated accordingly.  On reconnect, a `Last-Event-ID` header is sent if the server previously set an `id:` field.

Calling `close()` stops reconnection.  Calling `open()` again resumes it.

### `fetch` as Stream

The SSE extension also adds a `Stream` conversion to the [`fetch`](/commands/fetch) command.

This is useful for one-shot SSE streams (AI chat responses, progress updates, file processing) where you don't need the long-lived connection management of `eventsource`.

~~~ hyperscript
fetch /api/generate as Stream
~~~

The extension automatically adds an `Accept: text/event-stream` header to the
request so the server knows to respond with an SSE stream.

The result is a stream object. Named events from the server are dispatched on the current element, and unnamed messages can be iterated with a `for` loop:

#### Named events

If the server sends named SSE events (with an `event:` field), they are dispatched
as DOM events on the element that initiated the fetch. Handle them with `on`:

~~~ hyperscript
on click
  fetch /api/process as Stream
end
on status -- from SSE stream
  put event.detail.data into #progress
end
~~~

#### Iterating messages

Unnamed messages (plain `data:` lines with no `event:` field) are available as
an async iterable. Use `for ... in the result` to process each message as it
arrives:

~~~ hyperscript
on click
  fetch /api/chat as Stream
  for message in the result
    put message at end of #output
  end
end
~~~

The loop body runs once per message, blocking until the next one arrives. When the stream closes, the loop exits normally.

#### Waiting for the stream to end

The stream fires a `streamEnd` event on the element when the server closes the
connection:

~~~ hyperscript
on click
  fetch /api/export as Stream
  wait for streamEnd
  put "Done!" into me
end
~~~

#### Error handling

If the stream encounters an error, a `streamError` event is dispatched on the element with an `error` property in the detail:

~~~ hyperscript
on click
  fetch /api/generate as Stream
  on streamError from me
    put "Connection lost" into #status
  end
end
~~~

{% note %}
Without the SSE extension loaded, `fetch ... as Stream` throws an error telling you to include the extension.
{% endnote %}

### Syntax

```ebnf
eventsource <source-name> [from <source-url>]
    [with credentials] [with method <string>] [with headers <object>]
  (on <event-pattern> [as (JSON | string)] <command>+ end)*
end

fetch <url> as Stream    -- one-shot SSE via the Stream conversion
```

Event patterns support `*` as a wildcard (e.g. `"user.*"`, `"*"`).
