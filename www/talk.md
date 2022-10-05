
# hyperscript talk


[htmx & hyperscript discord server](https://htmx.org/discord)
[issue tracker](https://github.com/bigskysoftware/_hyperscript/issues)
[twitter: @htmx_org](https://twitter.com/htmx_org) <iframe src="https://github.com/sponsors/bigskysoftware/button" title="Sponsor bigskysoftware" style="border: 0; height: 32px; width: 6em"></iframe>
{.tool-bar}


## announcements

<ul role="list" class="list-of-links"> 
{%- for post in collections.post reversed -%}
  <li><p><time>{{ post.date | date: "%Y-%m-%d"}}</time>&emsp;<a href="{{ post.url }}">{{ post.data.title }} </a></li>
{%- endfor -%}
</ul>

