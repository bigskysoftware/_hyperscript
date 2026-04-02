---
templateEngineOverride: njk,md
---

# The hyperscript Cookbook

Below is a collection of hyperscript snippets for achieving various patterns in web development.

{% for dish in collections.cookbook %}

<div class="recipe-card">
<div class="recipe-header">

## {{ dish.data.title }} {\#{{dish.fileSlug}}}

</div>
<div class="recipe-body">

{{ dish.templateContent | safe }}

</div>
</div>

{% endfor %}
