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
<style>
  .red {
    background: rgba(255,0,0,0.48) !important;
  }
</style>
{% endexample %}


The first thing you probably noticed is that hyperscript is defined directly on the button, using the `_` (underscore)
attribute.

This is the hyperscript way: you put the code [on the thing that does the thing](https://htmx.org/essays/locality-of-behaviour/). 

The second thing you probably notices is that hyperscript reads like english.  Hyperscript is a member of the [xTalk](https://en.wikipedia.org/wiki/XTalk) family of scripting languages, starting with [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf).

This syntax has two advantages for a scripting language embedded in HTML:

* It avoids noisy punctuation, so scripts sit naturally inside HTML attributes
* It reads top-to-bottom, so the behavior of a script is visible from the source

The syntax takes a bit of getting used to, but once it clicks, scripts become easy to scan.

## Install & Quick Start {#install}

Hyperscript is dependency-free and can be installed with a simple `<script>` tag:

  ~~~ html
  <script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.90/dist/_hyperscript.min.js" integrity="sha384-PV7wvDa1ZQdFKClS9VFcKq4DDcjiyR2kv1OlifemiOm0IPHAZXdagLZ4RksgbypK" crossorigin="anonymous"></script>
  ~~~

### ES Module

Hyperscript ships as an ES module too, either from the CDN:

  ~~~ html
  <script type="module" src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.90/dist/_hyperscript.esm.min.js" integrity="sha384-oJBoPLZDDnPSYYJHSReRkxJGqCFX1TaguJ/NhSF96o8UbTNcEAO54fecZgqeHT2X" crossorigin="anonymous"></script>
  ~~~

or via npm.

### NPM Package

The npm package is [`hyperscript.org`](https://www.npmjs.com/package/hyperscript.org) (yes, the full domain name):

  ~~~ bash
  npm install hyperscript.org
  ~~~

Then import it in your bundler of choice:

  ~~~ js
  import 'hyperscript.org';
  ~~~

The import auto-initializes hyperscript on the page, you don't need to import anything.

### Start Scripting

Once hyperscript is installed, you can add hyperscript scripts to any element using the `_` (underscore) attribute:

{% example "Hello World" %}
<button _="on click put 'Hello World' into me">
Click Me!
</button>
{% endexample %}

You can also place hyperscript in script tags of type `text/hyperscript`

~~~ html
<script type="text/hyperscript">
on mousedown
  log "A mouse down happened: ", event
end
</script>
~~~

### Onward!

Hyperscript is a sister project of [htmx](https://htmx.org) and [integrates with it](/docs/conclusion/#htmx) directly.

OK, now let's learn us some hyperscript...

<div class="docs-page-nav">
<a href="/docs/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5m-7 7l7-7 7 7"/></svg> <strong>Docs Home</strong></a>
<a href="/docs/language/" class="next"><strong>Language</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

---


<div class="aside" >

<h4 id="size" tabindex="-1" style="margin:0"><a class="header-anchor" href="#size" aria-hidden="true">§</a> Aside: Is Hyperscript Too Big?</h4>

You might be wondering: how big is this thing?

Hyperscript is ~38KB over the wire (minified + brotli'd).  That's the
full language: parser, runtime, async engine, event system, everything.

Here's what that means in practice:

| Network | Typical Speed | Latency | Transfer Time | Total  |
|---------|---------------|---------|---------------|--------|
| 3G      | 2 Mbps        | ~100ms  | ~152ms        | ~250ms |
| 4G      | 30 Mbps       | ~50ms   | ~10ms         | ~60ms  |
| 5G      | 100+ Mbps     | ~10ms   | ~3ms          | ~13ms  |

On 3G, hyperscript loads in about a quarter of a second.  On a modern connection it's
effectively instant.

More importantly: **this is usually a one-time cost.**

With proper `Cache-Control` headers (which CDNs like jsDelivr set automatically), returning visitors
never download it again.  The browser stores both the downloaded file and its compiled bytecode,
so subsequent page loads pay zero network cost and near-zero parse cost across all your pages that use it.

Furthermore, **browsers download resources in parallel**.  

While hyperscript is loading, your images, stylesheets, and other assets are loading too, and only the largest ones matter.  A single 
hero image is typically 200KB–2MB, dwarfing hyperscript's 38KB.  

In practice, hyperscript typically finishes downloading long before images, meaning it adds nothing to your overall page 
load.  

So, in most cases, hyperscript is effectively free, hiding for one trip entirely within the download time of assets you were already 
paying for.

</div>

</div></div>
