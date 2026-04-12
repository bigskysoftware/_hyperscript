---
layout: pattern.njk
title: Reactive Tip Calculator
description: Two inputs, one derived total. Change either field and the total recomputes via `live` - no event wiring between them.
tags: [reactivity, forms]
difficulty: beginner
---

A bill amount, a tip percentage, and a total that updates as you type in
either field. The inputs and the total communicate through reactive variables, and the 
total automatically tracks which variables it depends on.

{% example "Type in either field" %}
<div class="receipt">
    <div class="receipt-header">
        ★ ★ ★<br>
        TIP CALCULATOR
    </div>

    <div class="receipt-line">
        <label for="bill-input">Bill</label>
        <input id="bill-input" type="number" min="0" step="0.01" value="20"
               _="bind $bill to me">
    </div>

    <div class="receipt-line">
        <label for="tip-input">Tip&nbsp;%</label>
        <input id="tip-input" type="number" min="0" step="1" value="18"
               _="bind $tip to me">
    </div>

    <div class="receipt-rule"></div>

    <div class="receipt-line receipt-total">
        <span>Total</span>
        <strong _="live
                     set total to ($bill * (1 + ($tip / 100))) as Fixed:2
                     put '$' + total into me"></strong>
    </div>

    <div class="receipt-footer">
        Thank you!
    </div>
</div>
<style>
.receipt {
    width: 18rem;
    margin: 1rem auto;
    padding: 1.25rem 1.25rem 0;
    background: #fdfcf6;
    border: 1px solid #d8d4c5;
    border-bottom: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    font-family: "IBM Plex Mono", "SF Mono", "Source Code Pro", "Consolas", monospace;
    font-size: 0.9rem;
    color: #2a2620;
    position: relative;
}
.receipt::after {
    content: '';
    display: block;
    height: 12px;
    background:
        linear-gradient(135deg, #fdfcf6 25%, transparent 25%) -6px 0 / 12px 12px,
        linear-gradient(225deg, #fdfcf6 25%, transparent 25%) -6px 0 / 12px 12px;
    margin: 0 -1.25rem;
    position: relative;
    top: 1px;
}
.receipt-header {
    text-align: center;
    font-family: var(--font-heading), sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    padding-bottom: 1rem;
    border-bottom: 1px dashed #c5bfa8;
    margin-bottom: 1rem;
    line-height: 1.6;
}
.receipt-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0;
}
.receipt-line label {
    font-family: var(--font-heading), sans-serif;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #6a5f48;
}
.receipt-line input {
    width: 6.5rem;
    text-align: right;
    font-family: inherit;
    font-size: 1rem;
    padding: 4px 6px;
    background: transparent;
    border: none;
    border-bottom: 1px dotted #8a7f68;
    border-radius: 0;
    color: #2a2620;
}
.receipt-line input:focus {
    outline: none;
    border-bottom-color: #2b6b1f;
    background: #fff;
}
.receipt-rule {
    border-top: 1px dashed #c5bfa8;
    margin: 0.5rem 0 0.25rem;
}
.receipt-total {
    padding: 0.5rem 0;
    font-size: 1.05rem;
}
.receipt-total span {
    font-family: var(--font-heading), sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.85rem;
}
.receipt-total strong {
    font-size: 1.3rem;
    color: #2b6b1f;
    font-family: inherit;
}
.receipt-footer {
    text-align: center;
    padding: 0.75rem 0 1rem;
    font-size: 0.78rem;
    color: #8a7f68;
    font-style: italic;
}
</style>
{% endexample %}


The calculator is three bits of hyperscript:

~~~ hyperscript
bind $bill to me   -- on the bill input
bind $tip  to me   -- on the tip % input

live                                                     -- on the total
  set total to ($bill * (1 + ($tip / 100))) as Fixed:2
  put '$' + total into me
~~~

[`bind`](/features/bind) `$bill to me` is two-way binding: it keeps the global reactive variable
`$bill` and the input's `value` in sync in both directions. Type in the
input, `$bill` updates. Set `$bill` from anywhere else, the input updates.

Same for `$tip`.

[`live`](/features/live) evaluates its body once at install time and automatically tracks
which variables it reads. The total's `live` block reads both `$bill` and
`$tip`. Whenever either variable changes, the body re-runs and the new value lands in the element.

The `as Fixed:2` conversion converts the final number into a fixed-precision string representation.