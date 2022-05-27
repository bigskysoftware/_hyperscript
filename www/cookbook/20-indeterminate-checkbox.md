---
title: Set a checkbox to indeterminate state on load/reset
---

{% example "Click 'Reset' to get an indeterminate checkbox" %}
<form>
<input class="indeterminate" type="checkbox" _="on load set my.indeterminate to true">
<input type="reset" _="on click set .indeterminate.indeterminate to true">
</form>
{% endexample %}

HTML checkboxes technically have three states - checked, unchecked and indeterminate. Oddly,
the indeterminate state can only be set via the JavaScript runtime - there is no way to set the state
via HTML or CSS alone.

In this example, the checkbox sets the indeterminate state when the page is loaded. In addition,
the "indeterminate" class is also set, allowing the handler on the reset button to use a CSS query to reset
all matching elements back to the indeterminate state.
