---
layout: pattern.njk
title: Reactive List
description: A Todo List you can add, remove and search
tags: [reactivity, list]
difficulty: intermediate
---

{% example "Reactive Todo List" %}

<label>Search:</label>
<input type="search"
       _="set $todos to ['a', 'b', 'c']
          set $search to ''
          bind me to $search" type="search"/>

<template live>
<ul>
  #for todo in $todos where it contains $search ignoring case index i
    <li>${todo} <a _="on click remove $todos[${i}]">Remove</a></li>
  #end
</ul>
</template>

<input type="text"
       _="on add
             halt unless my value is not empty
             append my value to $todos
             clear me
          on keyup[key is 'Enter'] trigger add"/>
<button _="on click send add to the previous <input/>">Add</button>


{% endexample %}


