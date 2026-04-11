---
layout: pattern.njk
title: Linked Scroll
description: A `behavior` that keeps two or more scrollable elements in sync. Drop `install LinkedScroll` on each one and they scroll together.
tags: [behavior, dom, interaction]
difficulty: intermediate
---

A `behavior` that keeps any number of scrollable elements in lock-step. Scroll
one and the others follow. The trick is a re-entry guard built from a single
data attribute, so the synchronized scrolls don't echo back and forth forever.

{% example "Scroll either column - the other follows" %}
<div>
<script type="text/hyperscript">
behavior ScrollLock
  set @data-locked-scroll to 'true'
  on scroll
    tell <[data-locked-scroll]/> where it is not me 
      set your scrollTop to my scrollTop
      set your scrollLeft to my scrollLeft
    end
   end
end
</script>

<div class="linked-scroll-demo">
<pre class="linked-column" _="install ScrollLock">
 1 | Lorem ipsum dolor sit amet
 2 | consectetur adipiscing elit
 3 | sed do eiusmod tempor
 4 | incididunt ut labore et
 5 | dolore magna aliqua
 6 | Ut enim ad minim veniam
 7 | quis nostrud exercitation
 8 | ullamco laboris nisi ut
 9 | aliquip ex ea commodo
10 | consequat. Duis aute irure
11 | dolor in reprehenderit in
12 | voluptate velit esse cillum
13 | dolore eu fugiat nulla
14 | pariatur. Excepteur sint
15 | occaecat cupidatat non
16 | proident, sunt in culpa
17 | qui officia deserunt mollit
18 | anim id est laborum
</pre>
<pre class="linked-column" _="install ScrollLock">
 1 | The quick brown fox jumps
 2 | over the lazy dog. Pack my
 3 | box with five dozen liquor
 4 | jugs. How vexingly quick
 5 | daft zebras jump! Sphinx
 6 | of black quartz, judge my
 7 | vow. The five boxing wizards
 8 | jump quickly. Bright vixens
 9 | jump; dozy fowl quack. Quick
10 | wafting zephyrs vex bold
11 | Jim. Jackdaws love my big
12 | sphinx of quartz. Glib jocks
13 | quiz nymph to vex dwarf.
14 | Crazy Fredrick bought many
15 | very exquisite opal jewels.
16 | We promptly judged antique
17 | ivory buckles for the next
18 | prize at the fair.
</pre>
</div>
</div>
<style>
.linked-scroll-demo {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin: 1rem 0;
}
.linked-column {
    max-block-size: 180px;
    overflow: auto;
    margin: 0;
    padding: 0.75rem 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fafafa;
    font-family: "IBM Plex Mono", "SF Mono", monospace;
    font-size: 0.85rem;
    line-height: 1.6;
    color: #333;
}
</style>
{% endexample %}

The behavior:

~~~ hyperscript
behavior LinkedScroll
    init
        set my @data-scrolling to 'false'
    end
    on scroll
        if my @data-scrolling is 'false'
            for el in <[data-scrolling]/>
                if el is not me
                    set el's @data-scrolling to 'true'
                    set el's scrollTop to my scrollTop
                    set el's scrollLeft to my scrollLeft
                end
            end
        end
        set my @data-scrolling to 'false'
    end
end
~~~

Then `install LinkedScroll` on each scrollable element you want linked.

## Why the data attribute

The naive version of this pattern - "on scroll, set the other element's
scrollTop to mine" - creates an infinite loop. Setting `scrollTop` fires a
`scroll` event on the target. That target's handler then tries to sync back
to the source, which fires another scroll event, and so on. Two columns
scrolling at slightly different rates can echo back and forth indefinitely.

The fix is a one-bit re-entry guard, stored on each element as
`@data-scrolling`:

1. **Real user scroll**: the source's `data-scrolling` is `'false'`. The
   handler enters the body, marks every *other* linked element's
   `data-scrolling` to `'true'` *before* writing their scroll positions, then
   resets its own flag at the end.
2. **Echo scroll** (triggered by setting `scrollTop` on a sibling): when that
   sibling's scroll event fires, its `data-scrolling` is now `'true'`, so the
   handler skips the propagation step. It still resets its own flag at the
   end so the next real user scroll works.

The flag has to be set *before* the scroll write, not after, because scroll
events from programmatic `scrollTop = ...` fire on the next paint - by the
time the sibling's handler runs, our handler has already finished and reset
its own flag, so we can't rely on "did the source's flag move." Each element
manages its own flag independently.

`<[data-scrolling]/>` is a CSS attribute selector inside a hyperscript query
literal - it matches any element with the `data-scrolling` attribute set,
regardless of value. That's how the behavior discovers its siblings without
needing IDs or class names: every linked element identifies itself by having
the data attribute, which it sets on itself in `init`.

## Drop-in usage

The behavior works for any number of scrollers, not just two:

~~~ html
<pre class="column" _="install LinkedScroll">...</pre>
<pre class="column" _="install LinkedScroll">...</pre>
<pre class="column" _="install LinkedScroll">...</pre>
~~~

It also syncs both axes - `scrollLeft` as well as `scrollTop` - so it works
for horizontally-scrolling tables, side-by-side diff views, parallel logs,
or anything else where the user expects "scrolling one means scrolling all."

> Adapted from [a gist by Geoffrey Eisenbarth](https://gist.github.com/geoffrey-eisenbarth/b8137075e291168ef23bc1bdccd68e33).
