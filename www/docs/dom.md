---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Working With The DOM {#working-with-the-dom}

The primary use case for hyperscript is adding small bits of interactivity to the DOM and, as such, it has a lot of syntax
for making this easy and natural.

We have glossed over a lot of this syntax in previous examples (we hope it was intuitive enough!) but now we will get
into the details of what they all do:

### Finding Elements {#finding-things}

There are two sides to DOM manipulation: finding stuff and mutating it.  In this section we will focus on how to
find things in the DOM.

#### DOM Literals {#dom-literals}

You are probably used to things like number literals (e.g. `1`) or string literals (e.g. `"hello world"`).

Since hyperscript is designed for DOM manipulation, it supports special literals that make it easy to work with the DOM.

Some are inspired by CSS, while others are our own creation.

Here is a table of the DOM literals:

{% syntaxes %}
`.[[class name]]`
`.{[[expression]]}`
	A <dfn>class literal</dfn> starts with a `.` and returns all elements with that class.

`#[[ID]]`
`#{[[expression]]}`
	An <dfn>ID literal</dfn> starts with a `#` and returns the element with that id.

`<[[css selector]] />`
	A <dfn>query literal</dfn> is contained within a `<` and `/>`, returns all elements matching the CSS selector.

`@[[attribute name]]`
	An <dfn>attribute literal</dfn> starts with an `@` (hence, *at*tribute, get it?) and returns the value of that
	attribute.

`*[[style property]]`
	A <dfn>style literal</dfn> starts with an `*` (a reference to [CSS Tricks](https://css-tricks.com/)) and returns the
	value of that style property.

`1em`
`0%`
`[[expression]] px`
	A <dfn>measurement literal</dfn> is an expression followed by a CSS unit, and it appends the unit as a string. So, the
	above expressions are the same as `"1em"`, `"0%"` and {%syntax "&#96;${[[expression]]}px&#96;"%}.
{% endsyntaxes%}

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

#### Finding Things In Other Things {#in}

Often you want to find things *within* a particular element.  To do this you can use the `in` expression:

  ~~~ hyperscript
  -- add the class 'highlight' to all paragraph tags in the current element
  add .highlight to <p/> in me
  ~~~

#### Finding The Closest Matching (Parent) Element {#closest}

Sometimes you wish to find the closest element in a parent hierarchy that matches some selector.  In JavaScript
you might use the [`closest()` function](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)

To do this in hyperscript you can use the [`closest`](/expressions/closest) expression:

  ~~~ hyperscript
  -- add the class 'highlight' to the closest table row to the current element
  add .highlight to the closest <tr/>
  ~~~

Note that `closest` starts with the current element
and recurses up the DOM from there.  If you wish to start at the parent instead, you can use this form:

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

#### Finding Things Relative To Other Things {#relative_positional}

You can use the [relative positional expressions](/expressions/relative-positional) `next` and `previous` to get an element
 relative to either the current element, or to another element:

  ~~~ hyperscript
  -- add the class 'highlight' to the next paragraph found in a forward scan of the DOM
  add .highlight to the next <p/>
  ~~~

Note that `next` and `previous` support wrapping, if you want that.

### Updating The DOM {#updating_things}

Using the expressions above, you should be able to find the elements you want to update easily.

Now, on to updating them!

#### Set & Put {#set-and-put}

The most basic way to update contents in the DOM is using the [`set`](/commands/set) and [`put`](/commands/put) commands.
Recall that these commands can also be used to set local variables.

When it comes to updating DOM elements, the `put` command is much more flexible, as we will see.

First, let's just set the `innerHTML` of an element to a string:

{% example "Setting innerHTML" %}
<button _="on click set my innerHTML to 'Clicked!'">
  Click Me
</button>
{% endexample %}

Using the `put` command would look like this:

{% example 'Setting properties with "put"' %}
<button _="on click put 'Clicked!' into my innerHTML">
  Click Me
</button>
{% endexample %}

In fact, the `put` command is smart enough to default to `innerHTML` when you put something into an element, so we can
omit the `innerHTML` entirely:

{% example "Putting things into elements" %}
<button _="on click put 'Clicked!' into me">
  Click Me
</button>
{% endexample %}

The `put` command can also place content in different places based on how it is used:

{% example "Put X before Y" %}
<button _="on click put 'Clicked!' before me">
  Click Me
</button>
{% endexample %}

The `put` command can be used in the following ways:

{% syntaxes %}
`put [[content]] before [[element]]`
	Puts the content in front of the element, using [`Element.before`][].
`put [[content]] at the start of [[element]]`
	Puts the content at the beginning of the element, using [`Element.prepend`][].
`put [[content]] at the end of [[element]]`
	Puts the content at the end of the element, using [`Element.append`][].
`put [[content]] after [[element]]`
	Puts the content after the element, using [`Element.after`][].
{% endsyntaxes %}

[`Element.before`]:  https://developer.mozilla.org/en-US/docs/Web/API/Element/before
[`Element.prepend`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/prepend
[`Element.append`]:  https://developer.mozilla.org/en-US/docs/Web/API/Element/append
[`Element.after`]:   https://developer.mozilla.org/en-US/docs/Web/API/Element/after

This flexibility is why we generally recommend the `put` command when updating content in the DOM.

##### Setting Attributes {#setting-attributes}

One exception to this rule is when setting attributes, which we typically recommend using `set`.

It just reads better to us:

{% example "Setting attributes" %}
<button _="on click set @disabled to 'disabled'">
  Disable Me
</button>
{% endexample %}

`set` is recommended for setting values into normal variables as well.

The [`default`](/commands/default) command sets a variable only if it is currently null, undefined, or empty:

  ~~~ hyperscript
  default x to 10       -- only sets x if it has no value
  default @count to 0   -- works with attributes too
  ~~~

#### Add, Remove & Toggle {#add-remove-toggle}

A very common operation in front end scripting is adding or removing classes or attributes from DOM elements. hyperscript
supports the [`add`](/commands/add), [`remove`](/commands/remove) and [`toggle`](/commands/toggle) commands to help do this.

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

You can also add, remove and toggle attributes as well.  Here is an example:

{% example "Toggle an attribute" %}
<button _="on click toggle @disabled on #say-hello">
  Toggle Disabled State
</button>
<button id="say-hello" _="on click alert('hello!')">
  Say Hello
</button>
{% endexample %}

Finally, you can toggle the visibility of elements by toggling a style literal:

{% example "Toggle an attribute" %}
<button _="on click toggle the *display of the next <p/>">
  Toggle The Next Paragraph
</button>
<p>
  Hyperscript is rad!
</p>
{% endexample %}

##### Taking Classes & Attributes {#take}

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

##### Removing Content {#removing}

You can also use the [`remove` command](/commands/remove) to remove content from the DOM:

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

By default, the `show` and `hide` commands will use the `display` style property.  You can instead use `visibility`
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

We mentioned this above, but as a reminder, you can toggle visibility using the `toggle` command:

{% example "Toggle visibility" %}
<button _="on click toggle the *display of the next <p/>">
  Toggle The Next Paragraph
</button>
<p>
  Hyperscript is rad!
</p>
{% endexample %}

#### Transitions {#transitions}

You can transition a style from one state to another using the [`transition` command](/commands/transition).  This
allows you to animate transitions between different states:

{% example '"transition" command' %}
<button _="on click transition my *font-size to 30px
               then wait 2s
               then transition my *font-size to initial">
  Transition My Font Size
</button>
{% endexample %}

The above example makes use of the special `initial` symbol, which you can use to refer to the initial value of an
elements style when the first transition begins.

##### Class-Based Transitions {#settling}

The `transition` command is blocking: it will wait until the transition completes before the next command executes.

Another common way to trigger transitions is by adding or removing classes or setting styles directly on an element.

However, commands like `add`, `set`, etc. do *not* block on transitions.

If you wish to wait until a transition completes after adding a new class, you should use the [`settle` command](/commands/settle)
which will let any transitions that are triggered by adding or removing a class finish before continuing.

{% example "Wait for transitions/animations to finish" %}
<button style="transition: all 800ms ease-in"
         _="on click add .red then settle then remove .red">
  Flash Red
</button>
{% endexample %}

If the above code did not have the `settle` command, the button would not flash red because the class `.red` would be
added and then removed immediately

This would not allow the 800ms transition to `.red` to complete.

### Measuring Things {#measuring}

Sometimes you want to know the dimensions of an element in the DOM in order to perform some sort of translation or
transition.  Hyperscript has a [`measure` command](/commands/measure) that will give you measurement information
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

{% example "Get A Styles Computed Value" %}
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

#### Ask & Answer {#ask-answer}

The `ask` and `answer` commands provide access to the browser's built-in dialogs:

  ~~~ hyperscript
  ask "What is your name?"
  put it into #greeting

  answer "File saved!"
  ~~~

`ask` wraps `prompt()` and places the result in `it`.  `answer` wraps `alert()` by default.

With two choices, `answer` wraps `confirm()` and the result is the chosen label:

  ~~~ hyperscript
  answer "Save changes?" with "Yes" or "No"
  if it is "Yes"
    -- save...
  end
  ~~~

### Speech {#speech}

As a nod to [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf), hyperscript includes a `speak` command
that uses the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) for text-to-speech:

  ~~~ hyperscript
  speak "Hello world"
  speak "Hello" with voice "Samantha"
  speak "Quickly now" with rate 2 with pitch 1.5
  ~~~

The command is async-transparent: it waits for the utterance to finish before continuing to the next command.  You can
configure `voice`, `rate`, `pitch`, and `volume` using `with` clauses.

<div class="docs-page-nav">
<a href="/docs/events/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Events</strong></a>
<a href="/docs/templates/" class="next"><strong>Templates & Morphing</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
