---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Working With The DOM {#working-with-the-dom}

The primary use case for hyperscript is adding small bits of interactivity to the DOM and, as such, it has a lot of
syntax for making this easy and natural.

We have glossed over a lot of this syntax in previous examples (we hope it was intuitive enough!) but now we will get
into the details of what they all do:

### Finding Elements {#finding-things}

There are two sides to DOM manipulation: finding stuff and mutating it. In this section we will focus on how to
find things in the DOM.

#### DOM Literals {#dom-literals}

You are probably used to things like number literals (e.g. `1`) or string literals (e.g. `"hello world"`).

Since hyperscript is designed for DOM manipulation, it supports special literals that make it easy to work with the DOM.

Some are inspired by CSS, while others are our own creation.

Here is a table of the DOM literals:

| Literal             | Syntax                                                               | Description                                                                                                         |
|---------------------|----------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| class literal       | {% syntax ".[[class name]]" %} <br> {% syntax ".{[[expression]]}" %} | Starts with `.` and returns all elements with that class                                                            |
| ID literal          | {% syntax "#[[ID]]" %} <br> {% syntax "#{[[expression]]}" %}         | Starts with `#` and returns the element with that id                                                                |
| query literal       | {% syntax "<[[css selector]] />" %}                                  | Contained within `<` and `/>`, returns all elements matching the CSS selector                                       |
| attribute literal   | {% syntax "@[[attribute name]]" %}                                   | Starts with `@` (hence, *at*tribute, get it?) and returns the value of that attribute                               |
| style literal       | {% syntax "*[[style property]]" %}                                   | Starts with `*` (a reference to [CSS Tricks](https://css-tricks.com/)) and returns the value of that style property |
| measurement literal | `1em` <br> `0%` <br> {% syntax "[[expression]] px" %}                | An expression followed by a CSS unit, appending the unit as a string                                                |

Here are a few examples of these literals in action:

  ~~~ hyperscript
  -- adds the 'disabled' class to the element with the id 'myDiv'
  add .disabled to #myDiv

  -- adds the 'highlight' class to all divs with the class 'tabs' on them
  add .highlight to <div.tabs/>

  -- sets the width of the current element to 35 pixels
  set my *width to 35px

  -- adds the `disabled` attribute to the current element
  add @disabled to me
  ~~~

Class literals, ID Literals and Query Literals all support a templating syntax.

This allows you to look up elements based on a variable rather than a fixed value:

  ~~~ hyperscript
  -- adds the 'disabled' class to the element with the id 'myDiv'
  set idToDisable to 'myDiv'
  add .disabled to #{idToDisable}

  -- adds the 'highlight' class to all elements with the 'tabs' class
  set classToHighlight to 'tabs'
  add .highlight to .{classToHighlight}

  -- removes all divs w/ class .hidden on them from the DOM
  set elementType to 'div'
  remove <${elementType}.hidden/>
  ~~~

All these language constructs make it very easy to work with the DOM in a concise, enjoyable manner.

Compare the following JavaScript:

  ~~~ js
  document.querySelector('#example-btn')
    .addEventListener('click', e => {
      document.querySelectorAll(".elements-to-remove").forEach(value => value.remove());
  })
  ~~~

with the corresponding hyperscript:

  ~~~ hyperscript
  on click from #example-btn
    remove .elements-to-remove
  ~~~

You can see how the support for CSS literals directly in hyperscript makes for a much cleaner script, allowing us
to focus on the logic at hand.

#### Finding In Things {#in}

Often you want to find things *within* a particular element. To do this you can use the `in` expression:

  ~~~ hyperscript
  -- add the class 'highlight' to all paragraph tags in the current element
  add .highlight to <p/> in me
  ~~~

#### Finding Parents {#closest}

Sometimes you wish to find the closest element in a parent hierarchy that matches some selector. In JavaScript
you might use the [`closest()` function](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)

To do this in hyperscript you can use the [`closest`](/expressions/closest) expression:

  ~~~ hyperscript
  -- add the class 'highlight' to the closest table row to the current element
  add .highlight to the closest <tr/>
  ~~~

Note that `closest` starts with the current element
and recurses up the DOM from there. If you wish to start at the parent instead, you can use this form:

  ~~~ hyperscript
  -- add the class 'highlight' to the closest div to the current element, excluding the current element
  add .highlight to the closest parent <div/>
  ~~~

#### Finding Things By Position {#positional}

You can use the [positional expressions](/expressions/positional) to get the first, last or a random element from
a collection of things:

  ~~~ hyperscript
  -- add the class 'highlight' to the first paragraph tag in the current element
  add .highlight to the first <p/> in me
  ~~~

#### Finding Nearby Things {#relative_positional}

You can use the [relative positional expressions](/expressions/relative-positional) `next` and `previous` to get an
element
relative to either the current element, or to another element:

  ~~~ hyperscript
  -- add the class 'highlight' to the next paragraph found in a forward scan of the DOM
  add .highlight to the next <p/>
  ~~~

Note that `next` and `previous` support wrapping, if you want that.

### Updating The DOM {#updating_things}

Using the expressions above, you should be able to find the elements easily.

#### Putting Content Into The DOM

Content can be put into the DOM using the [`put`](/commands/put) command. To put content into an element (that is, into 
its `innerHTML`) you can write:

{% example 'Setting properties with "put"' %}
<button _="on click put 'Clicked!' into me">
  Click Me
</button>
{% endexample %}

You can also use modifiers to the `put` command to place content in different places relative to the target element:

{% example "Put X before Y" %}
<button _="on click put 'Clicked!' before me">
  Click Me
</button>
{% endexample %}

The `put` command has the following modifiers:

| Syntax                                                     | Description                                                                                                                                   |
|------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| {% syntax "put [[content]] before [[element]]" %}          | Puts the content in front of the element, using [`Element.before`](https://developer.mozilla.org/en-US/docs/Web/API/Element/before)           |
| {% syntax "put [[content]] at the start of [[element]]" %} | Puts the content at the beginning of the element, using [`Element.prepend`](https://developer.mozilla.org/en-US/docs/Web/API/Element/prepend) |
| {% syntax "put [[content]] at the end of [[element]]" %}   | Puts the content at the end of the element, using [`Element.append`](https://developer.mozilla.org/en-US/docs/Web/API/Element/append)         |
| {% syntax "put [[content]] after [[element]]" %}           | Puts the content after the element, using [`Element.after`](https://developer.mozilla.org/en-US/docs/Web/API/Element/after)                   |

#### Replacing Content In The DOM

If you want to _replace_ content in the DOM, then the [`set`](/commands/set) command is the right
choice.

To replace an element entirely in the DOM you would say:

{% example "Replacing an element" %}
<button _="on click set #replace-me to 'Clicked!'">
  Click Me
</button>
<span id="replace-me">Not Clicked Yet...</span>
{% endexample %}

Note that here the button is replaced entirely rather than the content being placed inside the button.

#### DOM Mutation Security

Content placed into the DOM with `put` or `set` is _not_ HTML escaped. 

This is intentional: it means you can insert rich content with tags, attributes, and
structure into the page easity. 

However, it also means that if the content comes from an untrusted source (a user,
a URL parameter, a response body you don't control), you can introduce an XSS vulnerability.

For example, this is dangerous if `userInput` is not trusted:

  ~~~ hyperscript
  put userInput into me            -- HTML is parsed; <img onerror=...> will fire
  set #greeting to userInput       -- same risk, replacing the whole element
  ~~~

To insert text safely, target the `textContent` property instead of the element itself.
The browser will treat the value as plain text:

  ~~~ hyperscript
  put userInput into my textContent    -- safe, text-only
  set my textContent to userInput      -- same, different phrasing
  ~~~

#### Add, Remove & Toggle {#add-remove-toggle}

A common operation in front end scripting is adding or removing classes or attributes from DOM elements.
hyperscript supports the [`add`](/commands/add), [`remove`](/commands/remove) and [`toggle`](/commands/toggle)
commands to do these operations.

Here are some examples adding, removing and toggling classes:

{% example '"add" command' %}
<button _="on click add .red to me">
  Click Me
</button>
{% endexample %}

{% example '"remove" command' %}
<button class="red" _="on click remove .red from me">
  Click Me
</button>
{% endexample %}

{% example '"toggle" command' %}
<button _="on click toggle .red on me">
  Click Me
</button>
{% endexample %}

You can also add, remove and toggle attributes as well. Here is an example:

{% example "Toggle an attribute" %}
<button _="on click toggle @disabled on #say-hello">
  Toggle Disabled State
</button>
<button id="say-hello" _="on click alert('hello!')">
  Say Hello
</button>
{% endexample %}

Finally, you can toggle the visibility of elements by toggling a style literal:

{% example "Toggle visibility" %}
<button _="on click toggle the *display of the next <p/>">
  Toggle The Next Paragraph
</button>
<p>
  Hyperscript is rad!
</p>
{% endexample %}

#### Taking Classes & Attributes {#take}

The [`take`](/commands/take) command removes a class (or attribute) from a set of elements and adds it to a target,
making it perfect for "active item" patterns like tab bars and menus:

{% example "Take a class" %}
<ul _="on click from <li/>
         take .selected from <li/> for the target">
  <li>Tab 1</li>
  <li>Tab 2</li>
  <li>Tab 3</li>
</ul>
{% endexample %}

<style>.selected { font-weight: bold; color: var(--accent); }</style>

This removes `.selected` from all `<li>` elements and adds it to the one that was clicked.

You can also take attributes with an optional replacement value:

  ~~~ hyperscript
  take @aria-selected with "true" from <li/> for the target
  ~~~

#### Removing Content {#removing}

You can use the [`remove` command](/commands/remove) to remove content from the DOM:

{% example "Remove an element" %}
<button _="on click remove me">
  Remove Me
</button>
{% endexample %}

The remove command is smart enough to figure out what you want to happen based on what you tell it to remove.

#### Showing & Hiding Things {#show-hide}

You can show and hide things with the [`show`](/commands/show) and [`hide`](/commands/hide) commands:

{% example "Show, Hide" %}
<button _="on click
             hide me
             wait 2s
             show me">
  Peekaboo
</button>
{% endexample %}

By default, the `show` and `hide` commands will use the `display` style property. You can instead use `visibility`
or `opacity` with the following syntax:

{% example "Show/hide strategies" %}
<button _="on click
             hide me with *opacity
             wait 2s
             show me with *opacity">
  Peekaboo
</button>
{% endexample %}

The `add`, `remove`, `show` and `hide` commands all support a `when` clause to conditionally apply to each element.
After execution, `the result` contains the array of elements that matched the condition.

Here is an example using `show ... when` to filter a list:

{% example "Filter elements with `show ... when`" %}
<input _="on keyup show <li/> in #color-list
                     when its innerHTML contains my value">
<ul id="color-list">
  <li>Red</li>
  <li>Blue</li>
  <li>Blueish Green</li>
  <li>Green</li>
  <li>Yellow</li>
</ul>
{% endexample %}

#### CSS Transitions {#transitions}

You can transition a style from one state to another using the [`transition` command](/commands/transition). This
allows you to animate transitions between different states:

{% example '"transition" command' %}
<button _="on click transition my *font-size to 30px
                    then wait 2s
                    then transition my *font-size to initial">
  Transition My Font Size
</button>
{% endexample %}

The above example makes use of the special `initial` symbol, which you can use to refer to the initial value of an
element's style when the first transition begins.

#### Class-Based CSS Transitions {#settling}

The `transition` command is blocking: it will wait until the transition completes before the next command executes.

Another common way to trigger transitions is by adding or removing classes or setting styles directly on an element.

However, commands like `add`, `set`, etc. do *not* block on transitions.

If you wish to wait until a transition completes after adding a new class, you should use the [
`settle` command](/commands/settle)
which will let any transitions that are triggered by adding or removing a class finish before continuing.

{% example "Wait for transitions/animations to finish" %}
<button style="transition: all 800ms ease-in"
        _="on click add .red then settle then remove .red">
  Flash Red
</button>
{% endexample %}

If the above code did not have the `settle` command, the button would not flash red because the class `.red` would be
added and then removed immediately.

This would not allow the 800ms transition to `.red` to complete.

#### View Transitions {#view-transitions}

The [`start a view transition`](/commands/view-transition) command wraps DOM mutations in a
[View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API),
animating between before and after snapshots of the DOM:

```hyperscript
start a view transition
    put newContent into #container
end
```

You can specify a transition type for CSS targeting:

```hyperscript
start a view transition using "slide-left"
    remove .active from .tab
    add .active to me
    put content into #panel
end
```

All animation timing and style is controlled via CSS (e.g. `::view-transition-old`, `::view-transition-new`).
If the browser does not support view transitions, the body runs normally with no animation.

See the [`start a view transition` command](/commands/view-transition) for full details.

### Measuring Things {#measuring}

Sometimes you want to know the dimensions of an element in the DOM in order to perform some sort of translation or
transition. Hyperscript has a [`measure` command](/commands/measure) that will give you measurement information
for an element:

{% example "Measure an Element" %}
<button _="on click measure my top then
                    put `My top is ${top}` into the next <output/>">
  Click Me To Measure My Top
</button>
<output>--</output>
{% endexample %}

You can also use the pseudo-style literal form `*computed-<style property>` to get the computed (actual) style property
value for an element:

{% example "Get A Style's Computed Value" %}
<button _="on click get my *computed-width
                    put `My width is ${the result}` into the next <output/>">
  Click Me To Get My Computed Width
</button>
<output>--</output>
{% endexample %}

### Other DOM Operations {#other-dom}

Hyperscript includes several additional commands for common DOM interactions:

#### Focus & Blur {#focus-blur}

The `focus` and `blur` commands set or remove keyboard focus:

  ~~~ hyperscript
  focus #name-input
  blur me
  ~~~

Both default to `me` if no target is given.

#### Empty {#empty}

The `empty` command removes all children from an element:

  ~~~ hyperscript
  empty #results
  ~~~

#### Select {#select}

The `select` command selects the text content of an input or textarea:

  ~~~ hyperscript
  select #search-input
  ~~~

#### Open & Close {#open-close}

The `open` and `close` commands work with dialogs, details elements and popovers:

  ~~~ hyperscript
  open #my-dialog      -- calls showModal() on a <dialog>
  close #my-dialog     -- calls close() on a <dialog>
  open #my-details     -- sets open attribute on a <details>
  close #my-details    -- removes open attribute from a <details>
  ~~~

For elements with a `popover` attribute, `open` and `close` call `showPopover()` and `hidePopover()` respectively.
As a fallback, they call `.open()` and `.close()` on the target.

You can also enter and exit fullscreen mode:

  ~~~ hyperscript
  open fullscreen #video
  close fullscreen
  ~~~

<div class="docs-page-nav">
<a href="/docs/events/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Events & Functions</strong></a>
<a href="/docs/async/" class="next"><strong>Async Transparency</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
