---
layout: pattern.njk
title: Reactive Todo List
description: A reactive todo list with add, done, and remove -- using live templates, object arrays, and the new `remove` command for index-based splicing.
tags: [reactivity, list, remove, live-template]
difficulty: intermediate
---

A complete todo list: add items, mark them done, remove them, filter by
text. State is a plain array of `{text, done}` objects, rendered by a
`<script type="text/hypertemplate" live>` that re-renders whenever the array changes.

{% example "Todo List" %}
<div class="todo-app"
     _="init set $todos to [{text:'Learn hyperscript', done:true},
                             {text:'Build something cool', done:false},
                             {text:'Ship it', done:false}]
            set $search to ''">

  <div class="todo-input">
    <input type="text" placeholder="What needs doing?"
           _="on keyup[key is 'Enter'] trigger add end
              on add
                halt unless my value is not empty
                append {text: my value, done: false} to $todos
                clear me" />
    <button _="on click send add to the previous <input/>">Add</button>
  </div>

  <input type="search" placeholder="Filter..."
         class="todo-filter"
         _="bind me to $search" />

  <script type="text/hypertemplate" live>
  <ul class="todo-list">
    #for todo in $todos where its text contains $search ignoring case index i
      <li class="${'done' if todo is done}">
        <label>
          <input type="checkbox" ${'checked' if todo is done}
                 _="on click set $todos[${i}].done to my checked" />
          <span>${todo.text}</span>
        </label>
        <span>DEBUG: done=${todo.done} isDone=${todo is done}</span>
        <button class="todo-remove" _="on click remove $todos[${i}]">x</button>
      </li>
    #else
      <li class="empty">Nothing here.</li>
    #end
  </ul>
  </script>
</div>
<style>
.todo-app { max-width: 28rem; }
.todo-input { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.todo-input input { flex: 1; padding: 0.5em; font: inherit; }
.todo-filter {
  display: block;
  width: 100%;
  padding: 0.4em;
  margin-bottom: 0.5rem;
  font: inherit;
  box-sizing: border-box;
}
.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.todo-list li {
  display: flex;
  align-items: center;
  padding: 0.5em 0.25em;
  border-bottom: 1px solid #eee;
}
.todo-list li label { flex: 1; display: flex; align-items: center; gap: 0.5em; cursor: pointer; }
.todo-list li.done span { text-decoration: line-through; color: #999; }
.todo-list li.empty { color: #999; font-style: italic; }
.todo-remove {
  background: none;
  border: none;
  color: #c33;
  cursor: pointer;
  font-size: 1.1em;
  padding: 0 0.4em;
  font-family: inherit;
}
.todo-remove:hover { color: #900; }
</style>
{% endexample %}

## How it works

### State

All state lives in two global variables initialized on the wrapper div:

```
init set $todos to [{text:'Learn hyperscript', done:true},
                     {text:'Build something cool', done:false},
                     {text:'Ship it', done:false}]
     set $search to ''
```

`$todos` is a plain array of `{text, done}` objects. `$search` is the
current filter string, two-way bound to the search input via `bind`.

### Adding items

The text input listens for Enter and has a named `add` event that the
button can trigger:

```
on keyup[key is 'Enter'] trigger add
on add
  halt unless my value is not empty
  append {text: my value, done: false} to $todos
  clear me
```

`append` pushes a new object onto `$todos`. The live template sees the
mutation and re-renders.

### Rendering

The `<script type="text/hypertemplate" live>` block renders the list. `#for` iterates `$todos`
with a `where` filter and an `index i` binding:

```
#for todo in $todos where its text contains $search ignoring case index i
  <li class="${'done' if todo.done else ''}">
    ...
  </li>
#else
  <li class="empty">Nothing here.</li>
#end
```

The `index i` gives us the position of each item in the original
(unfiltered) array, which we need for the checkbox and remove button.

### Toggling done

Each checkbox writes back to the source array by index:

```html
<input type="checkbox" _="on click set $todos[${i}].done to my checked" />
```

`${i}` is interpolated at render time, so each checkbox targets its own
item. Setting the property triggers re-render, which updates the
`class="done"` and the strikethrough.

### Removing items

The remove button uses `remove` with an index expression:

```html
<button _="on click remove $todos[${i}]">x</button>
```

`remove $todos[${i}]` splices element `i` out of the array (a new feature
in 0.9.90). Because the value at that index is a plain object, not a DOM
node, `remove` dispatches to the array splice path instead of the DOM
detach path. The live template re-renders after the splice.
