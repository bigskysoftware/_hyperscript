
<script src="https://code.jquery.com/jquery-3.6.0.min.js"
  integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
  crossorigin="anonymous"></script>

# [Vanilla JS](http://vanilla-js.com/) v. [jQuery](https://jquery.com/) v. [hyperscript](/)

Below are comparisons of how to implement various common UI patterns in vanilla javascript, jQuery and hyperscript.  

In general, the VanillaJS version will be the most awkward. Many examples shown here require coordination between the markup and the JS code (and CSS too, though we use inline styles here for the sake of brevity). The coupling between HTML, CSS and JS flies in the face of [separation of concerns][] and makes code hard to reuse across elements on the page. In larger applications, frameworks are used that offer component models to alleviate this.

The jQuery version will be better, but will separate the logic from the
element in question.  This is considered good practice by some people, in the name of [separation of concerns][], but it violates [locality of behavior](https://htmx.org/essays/locality-of-behaviour/), which we feel is usually more important for system maintainability.  (If you've ever had to hunt for an obscure event handler in jQuery, you know what we mean.)  

Both the VanillaJS and JQuery verisons will often require callbacks, making for awkward expression of logic that is straight-forward and linear in hyperscript.  This becomes especially pronounced in more complex promise or callback chains.

[separation of concerns]: https://en.wikipedia.org/wiki/Separation_of_concerns
## Comparisons

* [Fade And Remove](#fade-and-remove)
* [Fetch And Insert](#fetch-and-insert)
* [Debounced Input](#debounced-input)
* [Toggle A Class](#toggle-a-class)
* [Trigger An Event](#trigger-an-event)
* [Show An Element](#show-an-element)

## Fade And Remove

Pattern: fade and remove an element after it is clicked

### VanillaJS

```html
<style>
.fade-out {
  opacity: 0;
}
#vanilla-remove-me {
  transition: opacity 1s ease-in-out;
}
</style>

<!-- Author has to foresee that this element will be faded out 
     with a transition. Those concerns aren't looking too
     separated anymore... -->
<div id="vanilla-remove-me">
  Remove Me
</div>

<script>
  document.querySelector('#vanilla-remove-me')
    .addEventListener('click', e => {
      // Coupled with the page stylesheet.
      e.target.classList.add('fade-out')

      // Would need changing if we used a @keyframes animation 
      // instead of a transition for the .fade-out class.
      e.target.addEventListener('transitionend', () => {
        e.target.remove()
      })
    })
</script>
```
<style>
.fade-out {
  opacity: 0;
}
#vanilla-remove-me {
  transition: opacity 1s ease-in-out;
}
</style>
<!-- Author has to foresee that this element will be faded out 
     with a transition. Those concerns aren't looking too
     separated anymore... -->
<div id="vanilla-remove-me">
  Remove Me
</div>
<script>
  document.querySelector('#vanilla-remove-me')
    .addEventListener('click', e => {
      // Coupled with the page stylesheet.
      e.target.classList.add('fade-out')
//
      // Would need changing if we used a @keyframes animation 
      // instead of a transition for the .fade-out class.
      e.target.addEventListener('transitionend', () => {
        e.target.remove()
      })
    })
</script>


### jQuery
```html
<script>
$(function(){
  $("#jquery-remove-me").click(function(){
    $(this).fadeOut(500, function(){
        $(this).remove();
    });
  });
});
</script>
<div id="jquery-remove-me">
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

### hyperscript

```html
<div _="on click transition opacity to 0 then remove me">
  Remove Me
</div>
```

<div _="on click transition opacity to 0 then remove me">
  Remove Me
</div>

## Fetch And Insert

Pattern: fetch some data and insert it into an element

### VanillaJS

```html
<button id="vanilla-fetch-it">
 Fetch It
</button>
<div id="fetch-target-1"></div>
<script>
document.querySelector('#vanilla-fetch-it')
  .addEventListener('click', async () => {
    document.getElementById('fetch-target-1')
      .innerHTML = await fetch('/clickedMessage/').then(r => r.text())
  })
</script>
```
<button id="vanilla-fetch-it">
 Fetch It
</button>
<div id="fetch-target-1"></div>
<script>
document.querySelector('#vanilla-fetch-it')
  .addEventListener('click', async () => {
    document.getElementById('fetch-target-1')
      .innerHTML = await fetch('/clickedMessage/').then(r => r.text())
  })
</script>

### jQuery
```html
<script>
$(function(){
  $("#jquery-fetch-it").click(function(){
    $.get('/clickedMessage/', function(data){
        $("#fetch-target-2").html(data);
     })
  });
});
</script>
<button id="jquery-fetch-it">
 Fetch It
</button>
<div id="fetch-target-2"></div>
```

<script>
$(function(){
  $("#jquery-fetch-it").click(function(){
    $.get('/clickedMessage/', function(data){
        $("#fetch-target-2").html(data);
     })
  });
});
</script>
<button id="jquery-fetch-it">
 Fetch It
</button>
<div id="fetch-target-2"></div>

### hyperscript

```html
<button _="on click
             fetch /clickedMessage/
             put the result into #fetch-target-3">
 Fetch It
</button>
<div id="fetch-target-3"></div>
```

<button _="on click
             fetch /clickedMessage/
             put the result into #fetch-target-3">
 Fetch It
</button>
<div id="fetch-target-3"></div>

## Debounced Input

Pattern: debounce event handling to avoid triggering logic in response to multiple, shortly
spaced events. This is specifically a _trailing debounce_.

### VanillaJS

```html
<input id="vanilla-debounce"/>
<div id="debounce-target-1"></div>
<script>
  let debounceState
  const debounceDuration = 300
  document.querySelector('#vanilla-debounce')
    .addEventListener('keyup', e => {
      if (debounceState) clearTimeout(debounceState)
      debounceState = setTimeout(() => {
        // Here comes the actual logic...
        document.getElementById('debounce-target-1')
          .innerHTML = e.target.value
      }, debounceDuration)
    })
</script>
```
<input id="vanilla-debounce" placeholder="Enter Some Data..."/>
<div id="debounce-target-1"></div>
<script>
  let debounceState
  const debounceDuration = 300
  document.querySelector('#vanilla-debounce')
    .addEventListener('keyup', e => {
      if (debounceState) clearTimeout(debounceState)
      debounceState = setTimeout(() => {
        // Here comes the actual logic...
        document.getElementById('debounce-target-1')
          .innerHTML = e.target.value
      }, debounceDuration)
    })
</script>

### jQuery
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
  $("#jquery-debounce").keyup(function(){
     clearTimeout(debounce);
     var self = $(this);
     debounce = setTimeout(function(){
       $('#debounce-target-2').html(self.val());
     }, 300);
  });
});
</script>
<input id="jquery-debounce" placeholder="Enter Some Data..."/>
<div id="debounce-target-2"></div>

### hyperscript

```html
<input _="on keyup debounced at 300ms
            put my.value into #debounce-target-3"/>
<div id="debounce-target-3"></div>
```
<input _="on keyup debounced at 300ms
            put my.value into #debounce-target-3"/>
<div id="debounce-target-3"></div>

## Toggle A Class

Pattern: toggle a class on another element when clicked

### VanillaJS

<style>
.red-border {
  border: 5px solid red;
}
</style>
```html
<!-- This imaginary person tried to get a _hyperscript-like
     experience, and relied on DOM clobbering. Shame on them... -->
<button onclick="toggleTarget1.classList.toggle('red-border')">
  Toggle Class
</button>
<div id="toggleTarget1">
  Toggle Target
</div>
```
<!-- This imaginary person tried to get a _hyperscript-like
     experience, and relied on DOM clobbering. Shame on them... -->
<button onclick="toggleTarget1.classList.toggle('red-border')">
  Toggle Class
</button>
<div id="toggleTarget1">
  Toggle Target
</div>

### jQuery
```html
<script>
$(function(){
  $("#toggleBtn").click(function(){
    $("#toggle-target-2").toggleClass("red-border");
  });
});
</script>
<button id="toggleBtn">
  Toggle Class
</button>
<div id="toggle-target-2">
  Toggle Target
</div>
```

<script>
$(function(){
  $("#toggleBtn").click(function(){
    $("#toggle-target-2").toggleClass("red-border");
  });
});
</script>

<button id="toggleBtn">
  Toggle Class
</button>

<div id="toggle-target-2">
  Toggle Target
</div>

### hyperscript

```html
<!-- Class- and ID-refs mean you can write concise code without
     relying on DOM clobbering. -->
<button _="on click toggle .red-border on #toggle-target-3">
  Toggle Class
</button>
<div id="toggle-target-3">
  Toggle Target
</div>
```

<button _="on click toggle .red-border on #toggle-target-3">
  Toggle Class
</button>
<div id="toggle-target-3">
  Toggle Target
</div>

## Trigger An Event

Pattern: trigger a custom event on another element in the DOM

### VanillaJS


```html
<button id="vanilla-trigger-btn">
  Trigger Event
</button>
<div id="event-target-1">Event Target</div>
<script>
  document.querySelector('#vanilla-trigger-btn')
    .addEventListener('click', e => {
      document.getElementById('event-target-1')
        // The event name makes up only ~12% of this line.
        // No wonder that custom events aren't used as often...
        .dispatchEvent(new Event('doIt'))
    })
  document.getElementById('event-target-1')
    .addEventListener("doIt", () => {
      document.getElementById('event-target-1').remove()
    })
</script>
```
<button id="vanilla-trigger-btn">
  Trigger Event
</button>
<div id="event-target-1">Event Target</div>
<script>
  document.querySelector('#vanilla-trigger-btn')
    .addEventListener('click', e => {
      document.getElementById('event-target-1')
        .dispatchEvent(new Event('doIt'))
    })
  document.getElementById('event-target-1')
    .addEventListener("doIt", () => {
      document.getElementById('event-target-1').remove()
    })
</script>

### jQuery
```html
<script>
$(function(){
  $("#jquery-trigger-btn").click(function(){
    $("#event-target-2").trigger("doIt");
  });
  $("#event-target-2").on('doIt', function(){
    $(this).remove();
  });
});
</script>
<button id="jquery-trigger-btn">
  Trigger Event
</button>
<div id="event-target-2">
  Event Target
</div>
```

<script>
$(function(){
  $("#triggerBtn").click(function(){
    $("#event-target-2").trigger("doIt");
  });
  $("#event-target-2").on('doIt', function(){
    $(this).remove();
  });
});
</script>

<button id="triggerBtn">
  Trigger Event
</button>

<div id="event-target-2">
  Event Target
</div>

### hyperscript

```html
<button _="on click send doIt to #event-target-3">
  Trigger Event
</button>
<div id="event-target-3"
     _="on doIt remove me">
  Event Target
</div>
```

<button _="on click send doIt to #event-target-3">
  Trigger Event
</button>
<div id="event-target-3"
     _="on doIt remove me">
  Event Target
</div>

## Show An Element

Make an element visible by setting the `display` style to `block`

### VanillaJS


```html
<button onclick="document.getElementById('show-target-1').style.display = 'block'">
  Show Element
</button>
<div style="display: none" id="show-target-1">
  Hidden Element
</div>
```
<button onclick="document.getElementById('show-target-1').style.display = 'block'">
  Show Element
</button>
<div style="display: none" id="show-target-1">
  Hidden Element
</div>

### jQuery
```html
<script>
$(function(){
  $("#showBtn").click(function(){
    $("#show-target-2").show();
  });
});
</script>
<button id="showBtn">
  Show Element
</button>
<div style="display: none" id="show-target-2">
  Hidden Element
</div>
```

<script>
$(function(){
  $("#showBtn").click(function(){
    $("#show-target-2").show();
  });
});
</script>
<button id="showBtn">
  Show Element
</button>
<div style="display: none" id="show-target-2">
  Hidden Element
</div>

### hyperscript

```html
<button _="on click show #show-target-3">
  Show Element
</button>
<div style="display: none" id="show-target-3">
  Hidden Element
</div>
```

<button _="on click show #show-target-3">
  Show Element
</button>
<div style="display: none" id="show-target-3">
  Hidden Element
</div>


<div style="height: 400px">
</div>
