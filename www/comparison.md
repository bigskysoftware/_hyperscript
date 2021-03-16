---
layout: layout.njk
title: ///_hyperscript
---

<script src="https://code.jquery.com/jquery-3.6.0.min.js"
  integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
  crossorigin="anonymous"></script>

# Comparisons

Below are some comparisons of how to implement various common UI patterns in vanilla javascript, jQuery and hyperscript


## <a name='fade-and-remove'>[Fade And Remove](#fade-and-remove)

Pattern: fade and remove an element after it is clicked

#### VanillaJS

```html
<div onclick="var self = this;
              self.style.transition = 'all 500ms ease-out';
              self.style.opacity = '1'; 
              setTimeout(function(){
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
<div _="on click transition opacity to 0 then remove me">
              Remove Me
</div>
```

<div _="on click transition opacity to 0 then remove me">
              Remove Me
</div>

## <a name='fetch-and-insert'>[Fetch And Insert](#fetch-and-insert)

Pattern: fetch some data and insert it into an element

#### VanillaJS

```html
<button onclick="fetch('/clickedMessage/')
                  .then(response => response.text())
                  .then(function(data) {
                      document.getElementById('fetch-target-1').innerHTML = data
                  })">
 Fetch It
</button>
<div id="fetch-target-1"></div>
```
<button onclick="fetch('/clickedMessage/')
                  .then(response => response.text())
                  .then(function(data) {
                     document.getElementById('fetch-target-1').innerHTML = data
                  })">
 Fetch It
</button>
<div id="fetch-target-1"></div>

#### jQuery
```html
<script>
$(function(){
  $("#fetchBtn").click(function(){
    $.get('/clickedMessage/', function(data){
        $("#fetch-target-2").html(data);
     })
  });
});
</script>
<button id="fetchBtn">
 Fetch It
</button>
<div id="fetch-target-2"></div>
```

<script>
$(function(){
  $("#fetchBtn").click(function(){
    $.get('/clickedMessage/', function(data){
        $("#fetch-target-2").html(data);
     })
  });
});
</script>
<button id="fetchBtn">
 Fetch It
</button>
<div id="fetch-target-2"></div>

#### hyperscript

```html
<button _="on click fetch /clickedMessage/ then put the result into #fetch-target-3">
 Fetch It
</button>
<div id="fetch-target-3"></div>
```

<button _="on click fetch /clickedMessage/ then put the result into #fetch-target-3">
 Fetch It
</button>
<div id="fetch-target-3"></div>

## <a name='debounced-input'>[Debounced Input](#debounced-input)

Pattern: debounce event handling to avoid triggering logic in response to multiple, shortly
spaced events

#### VanillaJS

```html
<input onkeyup="self = this;
                clearTimeout(self.debounce);
                self.debounce = setTimeout(function(){
                  document.getElementById('debounce-target-1').innerHTML = self.value;
                }, 300) "/>
<div id="debounce-target-1"></div>
```
<input placeholder="Enter Some Data..."
       onkeyup="self = this;
                clearTimeout(self.debounce);
                self.debounce = setTimeout(function(){
                  document.getElementById('debounce-target-1').innerHTML = self.value;
                }, 300) "/>
<div id="debounce-target-1"></div>

#### jQuery
```html
<script>
$(function(){
  var debounce = null;
  $("#debouncedInput").keyup(function(){
     clearTimeout(debounce);
     var self = $(this);
     debounce = setTimeout(function(){
       $('#debounce-target-2').html(self.val());
     }, 300);
  });
});
</script>
<input placeholder="Enter Some Data..."
       id="debouncedInput"/>
<div id="debounce-target-2"></div>
```

<script>
$(function(){
  var debounce = null;
  $("#debouncedInput").keyup(function(){
     clearTimeout(debounce);
     var self = $(this);
     debounce = setTimeout(function(){
       $('#debounce-target-2').html(self.val());
     }, 300);
  });
});
</script>
<input placeholder="Enter Some Data..."
       id="debouncedInput"/>
<div id="debounce-target-2"></div>

#### hyperscript

```html
<input _="on keyup debounced at 300ms put my.value into #debounce-target-3"/>
<div id="debounce-target-3"></div>
```
<input placeholder="Enter Some Data..."
       _="on keyup debounced at 300ms put my.value into #debounce-target-3"/>
<div id="debounce-target-3"></div>


<div style="height: 400px">
</div>

