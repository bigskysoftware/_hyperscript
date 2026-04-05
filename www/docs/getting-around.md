---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Getting Around {#getting-around}

Hyperscript makes it easy to move users around the page or to entirely new pages, with simple
English-like commands for navigation and scrolling.

### Going Places {#go}

The [`go` command](/commands/go) navigates the browser to a new location:

{% example "Going Elsewhere" %}
<button _="on click go to https://htmx.org">
  Go Check Out htmx
</button>
{% endexample %}

You can also navigate within the page using URL fragments, go back in history, or
navigate to a URL stored in a variable:

  ~~~ hyperscript
  go to #section-2              -- jump to an anchor on the page
  go back                       -- browser back
  set $url to "/dashboard"
  go to $url                    -- navigate to a URL from a variable
  go to "/help" in new window   -- open in a new window
  ~~~

### Scrolling {#scrolling}

The [`scroll`](/commands/scroll) command scrolls an element into view:

  ~~~ hyperscript
  scroll to #target
  scroll to the top of #target smoothly
  scroll to the bottom of me instantly
  ~~~

You can specify which vertical edge to scroll to (`top`, `middle`, `bottom`) and which
horizontal edge (`left`, `center`, `right`), as well as an offset:

  ~~~ hyperscript
  scroll to the top of #target +50px smoothly
  ~~~

Use `in` to scroll within a specific container without affecting outer scroll:

  ~~~ hyperscript
  scroll to #item in #sidebar smoothly
  ~~~

The `scroll by` form scrolls by a relative amount.  The direction defaults to `down` if omitted:

  ~~~ hyperscript
  scroll down by 200px
  scroll #panel left by 100px smoothly
  ~~~

{% example "Scrolling Around" %}
<button _="on click
             scroll to the top of the body smoothly
             wait 2s
             scroll to the bottom of the body smoothly">
  Take A Trip
</button>
{% endexample %}

<div class="docs-page-nav">
<a href="/docs/networking/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Networking</strong></a>
<a href="/docs/templates/" class="next"><strong>Templates & Morphing</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
