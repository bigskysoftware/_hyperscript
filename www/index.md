---
layout: layout.njk
title: ///hypescript
---

<div class="hero full-width">
<div class="c">
<h1><span class="s1">/</span><span class="s2">/</span><span class="s3">/</span><span class="s4">_</span>hyperscript</h1>
</div>
</div>

hyperscript is a small web scripting language based [applescript](https://en.wikipedia.org/wiki/Applescript) and
 [hypertalk](https://en.wikipedia.org/wiki/HyperTalk)

it is a companion project of <https://htmx.org>

## sample

```html
<button _="toggle clicked">
  Toggle the "clicked" class on me
</button>


<div _="on mouseOver toggle mouse-over on #foo">
</div>

<div _="on click call aJavascriptFunction() then
              wait 10s then 
              call anotherJavascriptFunction()">
           Do some stuff
</div>
```

## Grammar

     hyperscript => action_list;
     action_list => action {["then", action]};
     on_expr => "on", IDENTIFIER;
     action => [on_expr] operation_expr;
     operation_expr => add_expr | remove_expr | toggle_expr | call_expr | wait_expr
     add_expr => "add", IDENTIFIER, [on_expr];
     remove_expr => "remove", IDENTIFIER, [on_expr];
     toggle_expr => "toggle", IDENTIFIER, [on_expr];
     call_expr => "call" ? javascript_method_call_expr ?;
     wait_expr => "wait" time_expr;