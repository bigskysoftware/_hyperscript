---
title: Toggle a Class
tags: [basics, dom]
difficulty: beginner
---

{% example "Toggle a CSS class on click" %}
<div>
<button _="on click toggle .fun on me">Toggle Fun</button>
</div>
<style>
.fun {
    background: linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c, #ffd200, #4facfe, #667eea);
    background-size: 400% 400%;
    animation: fun-gradient 3s ease infinite;
    color: white;
    border-radius: 20px;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transform: scale(1.1) rotate(-2deg);
}
@keyframes fun-gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
</style>
{% endexample %}

The simplest hyperscript pattern: listen for an event, toggle a class. The element targets itself with `me`.
