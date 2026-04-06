---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Introduction

Hyperscript is a scripting language for [The Web](https://en.wikipedia.org/wiki/World_Wide_Web). It is designed to embed
well directly in [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML).

Here is a simple example of some hyperscript:

{% example %}
<button _="on click toggle .red on me">
Click Me
</button>
{% endexample %}

<style>
  .red {
    background: rgba(255,0,0,0.48) !important;
  }
</style>

The first thing you probably noticed is that hyperscript is defined directly on the button, using the `_` (underscore)
attribute.

This is the hyperscript way: putting code on the thing that does the thing. We made up a concept called
[Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/) to explain why we feel this is better than the
[Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) approach traditionally taken in web
development, with scripting and markup in separate locations.

The next thing you will almost certainly notice about hyperscript is its syntax, which is very different from most
programming languages used today.

Hyperscript is a member of the [xTalk](https://en.wikipedia.org/wiki/XTalk) family of scripting languages, which
ultimately derive from [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf), the scripting language of
[HyperCard](https://en.wikipedia.org/wiki/HyperCard).

These languages all read more like english than programming languages you are probably used to.

If you can get past your initial reaction, this syntax has some real advantages:

* It embeds very well in HTML by avoiding noisy syntax
* It is very easy to read, making it obvious what a script is doing

Hyperscript favors read time over write time when it comes to code. Once you have written your script, it is usually
very obvious what it does. So, when you come back to it, you can remember what it's doing easily.

Code is typically read many more times than it is written, so this tradeoff is a good one for scripting needs.

## Install & Quick Start {#install}

Hyperscript is a dependency-free JavaScript library. The simplest way to use it is a
`<script>` tag pointed at a CDN — no build step required:

  ~~~ html
  <script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.90/dist/_hyperscript.min.js" integrity="sha384-kNli9q2SAIKZyCaj/HsxM+q3rmzWVyOTVcwQ/X1tVf7h38a1wkbfBYpckMRA0eSr" crossorigin="anonymous"></script>
  ~~~

### As an ES Module

Hyperscript ships as an ES module too, either from the CDN:

  ~~~ html
  <script type="module" src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.90/dist/_hyperscript.esm.min.js" integrity="sha384-lNDEj2nrXBoU9smz+Hrc/bS3az2j390bFp8N7GvggJy3MkhIYx1aKrMVbJhuobyK" crossorigin="anonymous"></script>
  ~~~

or via npm.

The package is [`hyperscript.org`](https://www.npmjs.com/package/hyperscript.org):

  ~~~ bash
  npm install hyperscript.org
  ~~~

Then import it in your bundler of choice:

  ~~~ js
  import 'hyperscript.org';
  ~~~

The import auto-initializes hyperscript on the page — no further setup needed.

### Start Scripting

Once hyperscript is installed, you can add scripts to any element using the `_` attribute:

{% example "Hello World" %}
<button _="on click put 'Hello World' into me">
Click Me!
</button>
{% endexample %}

You can also add hyperscript within script tags that are denoted as `text/hyperscript`:

  ~~~ html
  <script type="text/hyperscript">
    on mousedown
      log "A mouse down happened: ", event
    end
  </script>
  ~~~

Hyperscript is a sister project of [`htmx`](https://htmx.org), and integrates with it seamlessly.

OK, let's see how to hyperscript...

<div class="docs-page-nav">
<a href="/docs/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5m-7 7l7-7 7 7"/></svg> <strong>Docs Home</strong></a>
<a href="/docs/language/" class="next"><strong>Language</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

---

### An Aside: Is Hyperscript Too Big? {#size}

<div class="aside">

You might be wondering: how big is this thing?

Hyperscript is ~36KB over the wire (minified + brotli'd).  That's the
full language: parser, runtime, async engine, event system, everything.

Here's what that means in practice:

| Network | Typical Speed | Latency | Transfer Time | Total  |
|---------|---------------|---------|---------------|--------|
| 3G      | 2 Mbps        | ~100ms  | ~144ms        | ~250ms |
| 4G      | 30 Mbps       | ~50ms   | ~10ms         | ~60ms  |
| 5G      | 100+ Mbps     | ~10ms   | ~3ms          | ~13ms  |

On 3G, hyperscript loads in about a quarter of a second.  On a modern connection it's
effectively instant.

More importantly: **this is a one-time cost.**  Once the browser downloads hyperscript, it's cached.

With proper `Cache-Control` headers (which CDNs like jsDelivr set automatically), returning visitors
never download it again.  The browser stores both the downloaded file and its compiled bytecode,
so subsequent page loads pay zero network cost and near-zero parse cost across all your pages that use it.

Furthermore, **browsers download resources in parallel**.  While hyperscript is loading, your
images, stylesheets, and other assets are loading too, and only the largest one usually matters.  A single 
hero image is typically 200KB–2MB, dwarfing hyperscript.  

In practice, hyperscript typically finishes downloading long before images, meaning it adds nothing to your overall page 
load.  

So, in most cases, hyperscript is effectively _oo_, hiding entirely within the download time of assets you were already 
paying for.

</div>

</div></div>
