
# The hyperscript Cookbook

Below is a collection of hyperscript snippets for achieving various patterns in web development.

{% for dish in collections.cookbook %}

<div class="heading-wrapper">
<a href="{{ dish.fileSlug }}">#</a>
<h2 id="{{ dish.fileSlug }}">{{ dish.data.title }}</h2>
</div>

{{ dish.templateContent | safe }}

{% endfor %}
