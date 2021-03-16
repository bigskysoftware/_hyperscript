---
layout: layout.njk
title: ///_hyperscript
---

<script src="https://code.jquery.com/jquery-3.6.0.min.js"
  integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
  crossorigin="anonymous"></script>

# Comparisons

Below are some comparisons of how to implement various common UI patterns in vanilla javascript, jQuery and hyperscript


## Fade And Remove

Pattern: fade and remove an element after it is clicked

#### VanillaJS

```html
<div onclick="var self = this;
              self.style.transition = 'all 500ms ease-out';
              self.style.opacity = '1'; setTimeout(function(){
                self.style.opacity = '0';
                self.addEventListener('transitionend', function(){
                    self.parentNode.removeChild(self);
                }, {once:true})
              }, 1) ">
              Remove Me
</div>
```

<div onclick="var self = this;
              self.style.transition = 'all 500ms ease-out';
              self.style.opacity = '1'; setTimeout(function(){
                self.style.opacity = '0';
                self.addEventListener('transitionend', function(){
                    self.parentNode.removeChild(self);
                }, {once:true})
              }, 1) ">
              Remove Me
</div>

#### jQuery
```html
<script>
$(function(){
  $("#divToRemove").click(function(){
    $(this).fadeOut(500, function(){
        $(this).remove();
    });
  });
});
</script>
<div id="divToRemove">
              Remove Me
</div>
```

<script>
$(function(){
  $("#divToRemove").click(function(){
    $(this).fadeOut(500, function(){
        $(this).remove();
    });
  });
});
</script>
<div id="divToRemove">
              Remove Me
</div>

#### hyperscript

```html
<div _="on click transition opacity to 0 then remove">
              Remove Me
</div>
```

<div _="on click transition opacity to 0 then remove">
              Remove Me
</div>

<hr style="margin-bottom: 300px; margin-top: 16px"/>