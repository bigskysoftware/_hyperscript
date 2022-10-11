---
templateEngineOverride: njk,md
---

# The hyperscript Cookbook

Below is a collection of hyperscript snippets for achieving various patterns in web development.

{% for dish in collections.cookbook %}

# {{ dish.data.title }} {\#{{dish.fileSlug}}}

{{ dish.templateContent | safe }}

{% endfor %}
