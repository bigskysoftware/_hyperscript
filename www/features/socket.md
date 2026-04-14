---
title: socket - ///_hyperscript
---

## The `socket` Feature

The `socket` feature lets you create WebSocket connections declaratively in hyperscript. It also provides a simple [Remote Procedure Call (RPC)](#rpc) mechanism layered on top of the raw socket, so you can call server-side functions as if they were local.

### Installing

The `socket` feature is an extension and must be included separately, *after* hyperscript itself:

```html
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.91/dist/_hyperscript.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.91/dist/ext/socket.min.js"></script>
```

Or if you're using npm: `import 'hyperscript.org/dist/ext/socket.js'` after importing hyperscript.

[Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) provide a mechanism for two-way communication
between a browser client and a server.

Here is a simple web socket declaration in hyperscript:

```hyperscript
socket MySocket ws://myserver.com/example
  on message as JSON
    log message
end
```

This socket will log all messages that it receives as a parsed JSON object.

You can send messages to the socket by using the normal [`send`](/commands/send) command:

```hyperscript
    send myMessage(foo: "bar", doh: 42) to MySocket
```

The `socket-url` is the address that the socket is connected to. Schemes like `ws` or `wss` can optionally be specified (like in `socket MySocket ws://myserver.com/example`). If not specified, hyperscript defaults to add the location's scheme-type, host and port (like in `socket MySocket /example`).

### RPC

Hyperscript provides a simple RPC mechanism layered on top of websockets. Given the socket definition above, you can
make the following call in hyperscript:

```html
<button
  _="on click call MySocket.rpc.increment(41) then put the result into me"
>
  Get the answer...
</button>
```

This will turn into a message that is sent to the server via the socket, with the following format:

```json
{
  "iid": "185795d2-84ca-11eb-8dcd-0242ac130003",
  "function": "increment",
  "args": [41]
}
```

The fields here are:

- `iid` - the invocation id
- `function` - the function to invoke
- `args` - an array of arguments for the function

The server can then invoke the method however it sees fit. It can respond asynchronously with a response message
of the following format:

```json
{ "iid": "185795d2-84ca-11eb-8dcd-0242ac130003", "return": 42 }
```

The invocation id must match the original invocation id sent by the client. If an exception occurred this can be
sent like so:

```json
{
  "iid": "185795d2-84ca-11eb-8dcd-0242ac130003",
  "throw": "An error occurred when calculating the answer..."
}
```

Note that, to the caller in hyperscript, this will look synchronous thanks to the [async-transparency](/docs#async)
of the hyperscript runtime.

If you wish to modify the default RPC timeout set for the socket, you can use a few different forms:

```html
<!-- a 5 second timeout -->
<button
  _="on click call MySocket.rpc.timeout(5000).increment(41) then put the result into me"
>
  Get the answer...
</button>

<!-- no timeout -->
<button
  _="on click call MySocket.rpc.noTimeout.increment(41) then put the result into me"
>
  Get the answer...
</button>
```

### Syntax

```ebnf
socket <socket-name> <socket-url> [with timeout <time-expression>]
  [on message [as JSON] <command>+ end]
end
```
