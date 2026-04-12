---
layout: pattern.njk
title: Reactive Todo List
description: A reactive todo list with add, done, and remove
tags: [reactivity, list, remove, live-template]
difficulty: intermediate
---

A complete todo list: add items, mark them done, remove them, filter by
text. State is a plain array of `{text, done}` objects, rendered by a
`<script type="text/hyperscript-template" live>` template that re-renders whenever the array changes.

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

  <script type="text/hyperscript-template" live>
  <ul class="todo-list">
    #for todo in $todos where the todo's text contains $search ignoring case
      <li class="${'done' if todo is done}">
        <label>
          <input type="checkbox" ${'checked' if todo is done}
                 _="on click set the todo's done to my checked" />
          <span>${todo.text}</span>
        </label>
        <button class="todo-remove" _="on click remove todo from $todos">x</button>
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

~~~ hyperscript
init set $todos to [{text:'Learn hyperscript', done:true},
                     {text:'Build something cool', done:false},
                     {text:'Ship it', done:false}]
     set $search to ''
~~~

`$todos` is a plain array of `{text, done}` objects. `$search` is the
current filter string, two-way bound to the search input via [`bind`](/features/bind).

### Adding items

The text input listens for Enter and has a named `add` event that the
button can trigger:

~~~ hyperscript
on keyup[key is 'Enter'] trigger add
on add
  halt unless my value is not empty
  append {text: my value, done: false} to $todos
  clear me
~~~

`append` pushes a new object onto `$todos`. The live template sees the
mutation and re-renders.

### Rendering

The `<script type="text/hyperscript-template" live>` block renders the
list. `#for` iterates `$todos` with a `where` filter:

~~~ html
#for todo in $todos where the todo's text contains $search ignoring case
  <li class="${'done' if todo is done}">
    ...
  </li>
#else
  <li class="empty">Nothing here.</li>
#end
~~~

### Toggling done

Each checkbox writes back to the todo object directly:

```html
<input type="checkbox" _="on click set the todo's done to my checked" />
```

Note that here we have inner hyperscript on the generated input, and it is able to reference `todo` as a normal variable.
This is because hyperscript captures scopes/closures associated with looping in templates and makes the loop variables 
available in generated scripts, making scripting with hyperscript templates natural.

### Removing items

The remove button uses [`remove`](/commands/remove) with the captured object reference:

```html
<button _="on click remove todo from $todos">x</button>
```

`remove todo from $todos` finds the object by reference in the array and
splices it out. The live template reactively re-renders after the splice.