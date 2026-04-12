---
layout: pattern.njk
title: Linked Scroll
description: A `behavior` that keeps two or more scrollable elements in sync. Drop `install LinkedScroll` on each one and they scroll together.
tags: [behavior, dom, interaction]
difficulty: intermediate
---

A `behavior` that keeps any number of scrollable elements in lock-step.
Scroll one, the others follow.

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

~~~ hyperscript
behavior ScrollLock
  set @data-locked-scroll to 'true'
  on scroll
    tell <[data-locked-scroll]/> where it is not me
      set your scrollTop to my scrollTop
      set your scrollLeft to my scrollLeft
    end
  end
end
~~~

The feature-level [`set`](/commands/set) `@data-locked-scroll to 'true'` marks each element
on [`install`](/features/install) so the `tell` query can find its peers without IDs or classes.

There's no re-entry guard because assigning `scrollTop` to its current
value is a no-op and **doesn't fire a scroll event** - so the cascade
terminates after one round. Works in all three engines.

{% note "When you'd need a guard" %}
The self-terminating trick assumes both scrollers can reach the same
value. If their content heights differ, setting the shorter one's
`scrollTop` clamps to its max, and the loop never settles. For asymmetric
scrollers, add a `data-scrolling` flag the handler checks first, or
normalize positions to a 0-1 range before assigning.
{% endnote %}

> Inspired by [a gist by Geoffrey Eisenbarth](https://gist.github.com/geoffrey-eisenbarth/b8137075e291168ef23bc1bdccd68e33).
