<div class="docs-layout">

<aside id="toc-wrapper">
<div id="toc-header">

<img src="/img/logo.png" alt="" id="toc-logo">

# _hyperscript <sub-title>documentation</sub-title> {.h2}

</div>

<nav aria-label="Table of contents" id="docs-nav"
     _="on intersection(intersecting) from <h2, h3, h4/> in #docs-content
          if intersecting
            get the id of the event's target
            if it is not empty
              set the link to the first <a[href='#${it}']/>
              if the link exists
                take .toc-active from <a/> in me for the link
                set navTop to me.getBoundingClientRect().top
                set linkTop to link.getBoundingClientRect().top
                set offset to linkTop - navTop - (me.clientHeight / 2)
                me.scrollBy({top: offset, behavior: 'smooth'})
              end
            end
          end">

[[toc]]

</nav>
</aside>

<div id="docs-content">
