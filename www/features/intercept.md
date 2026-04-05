---
title: intercept - ///_hyperscript
---

## The `intercept` Feature

The `intercept` feature lets you declare caching strategies and offline behavior
without writing service worker boilerplate. Under the hood it registers a
service worker that handles request interception according to your rules.

### Installing

The `intercept` feature is an extension and must be included separately, *after* hyperscript itself:

```html
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.90/dist/_hyperscript.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.90/dist/ext/intercept.min.js"></script>
```

Or if you're using npm: `import 'hyperscript.org/dist/ext/intercept.js'` after importing hyperscript.

The extension also needs a companion service worker file (`intercept-sw.js`) that must
be at a real URL in your app (service workers can't be registered from a CDN). Copy it
to your site root or serve it alongside the extension.

### Basic Example

```hyperscript
intercept /
    precache /, /style.css, /app.js as "v1"
    on /api/* use network-first
    on *.css, *.js use cache-first
    on * use stale-while-revalidate
    offline fallback /offline.html
end
```

### Syntax

```ebnf
intercept <scope-path>
    [precache <path>[, <path>]* [as <version-string>]]
    [on <pattern>[, <pattern>]* use <strategy>]*
    [offline fallback <path>]
end
```

- **`intercept <scope-path>`** — the URL scope the service worker controls.
  `intercept /` covers the whole site; `intercept /app` scopes to everything
  under `/app`.
- **`precache <path-list>`** — paths to cache when the service worker installs.
  The optional `as "<version>"` names the cache; changing it on your next
  deploy triggers an update and clears old caches.
- **`on <pattern> use <strategy>`** — route rules. Patterns are glob-like
  (`/api/*`, `*.css`, `*`), multiple patterns separated by commas. Rules are
  evaluated in order — first match wins.
- **`offline fallback <path>`** — page to serve when the network fails and
  no cache match exists.

Only GET requests are cached. Paths can be naked (no quotes) if they start
with `/` or `*`, or quoted strings.

### Caching Strategies

| strategy | behavior | use for |
|----------|----------|---------|
| `cache-first` | Try cache, fall back to network | Static assets (CSS, JS, images) |
| `network-first` | Try network, fall back to cache | HTML pages, API responses |
| `stale-while-revalidate` | Serve from cache, update in background | Most dynamic content |
| `cache-only` | Only serve from cache, offline fallback otherwise | Offline-first apps |
| `network-only` | Always fetch from network (no interception) | Uncacheable endpoints |

### One Per App

Only one `intercept` declaration is allowed per application. A second declaration
is ignored with a warning in the console. If you need different rules for
different areas, use a single `intercept` with multiple `on` rules.

### Scope and Headers

By default, a service worker's scope is limited to the directory of its script.
If `intercept-sw.js` lives at `/lib/intercept-sw.js`, the widest scope it can
claim is `/lib/`. To use `intercept /`, either:

1. Serve `intercept-sw.js` from the site root, or
2. Add the header `Service-Worker-Allowed: /` to the response

If registration fails due to scope restrictions, the extension logs an error
explaining which option to use.

### Updating the Cache

Service worker updates are triggered by the browser when the service worker
script changes. To force a cache refresh, change the `as "<version>"` string:

```hyperscript
intercept /
    precache / as "v2"   -- bump this to invalidate old caches
    ...
end
```

On the next page load the new service worker installs, activates, and deletes
caches that don't match the current version.

### Examples

#### Simple offline page

```hyperscript
intercept /
    precache /, /offline.html, /style.css as "v1"
    on * use network-first
    offline fallback /offline.html
end
```

#### API-heavy app

```hyperscript
intercept /
    precache / as "app-v3"
    on /api/* use network-first
    on *.css, *.js, *.woff2, *.png use cache-first
    on * use stale-while-revalidate
end
```

#### Docs site (aggressive caching)

```hyperscript
intercept /docs
    precache /docs as "docs-v1"
    on * use cache-first
    offline fallback /docs/offline.html
end
```
