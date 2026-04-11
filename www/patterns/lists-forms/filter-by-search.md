---
layout: pattern.njk
title: Filter Elements by Search
description: Live-filter a list of elements as the user types, using the `show ... when` form.
tags: [search, dom]
difficulty: intermediate
---

You can easily filter down the visibility of a set of elements based on a condition by using the `show ... when` form
of the [`show` command](/commands/show)

{% example %}
<div>
<input type="text" placeholder="Search Quotes..."
       _="on keyup
           if the event's key is 'Escape'
             clear then trigger keyup
           else
            show <blockquote/> in the next <div/>
               when its textContent contains my value
               ignoring case">
<div class="quotes">
<blockquote>"Talk is cheap. Show me the code." &mdash; Linus Torvalds</blockquote>
<blockquote>"Programs must be written for people to read, and only incidentally for machines to execute." &mdash; Harold Abelson</blockquote>
<blockquote>"Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live." &mdash; John Woods</blockquote>
<blockquote>"I'm not a great programmer; I'm just a good programmer with great habits." &mdash; Kent Beck</blockquote>
<blockquote>"Truth can only be found in one place: the code." &mdash; Robert C. Martin</blockquote>
<blockquote>"A language that doesn't affect the way you think about programming is not worth knowing." &mdash; Alan Perlis</blockquote>
<blockquote>"Everyone knows that debugging is twice as hard as writing a program in the first place. So if you're as clever as you can be when you write it, how will you ever debug it?" &mdash; Brian Kernighan</blockquote>
</div>
</div>
<style>.quotes { height: 15em; overflow-y: scroll; margin-top: 0.5em; }</style>
{% endexample %}

Here we do the search on keyup. If the key was an escape, we clear the input and rerun the event,
which shows all quotes. The `the next <div/>` expression targets the sibling container without needing an ID.
