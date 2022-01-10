
# Hyperscript

> "At my local Barnes and Noble, there is a huge wall of Java books just waiting to tip over and crush me one day. And one day it will. At the rate things are going, one day that bookcase will be tall enough to crush us all. It might even loop the world several times, crushing previous editions of the same Java books over and over again." [-why the lucky stiff](https://web.archive.org/web/20050124040155/http://poignantguide.net/ruby/)

Javascript started off life as a scripting language.  You used it for small snippets of code to make your website
more interactive.  It was fun.  You didn't have frameworks or routers or models or reactive components.  You just
wrote some scripts that did some stuff.

Now days Javascript feels like Java felt back when why wrote his [Poignant Guide](https://poignant.guide/) to Ruby.
React and Angular and Vue and on and on... so much stuff.  So much frameworking.  So much code...  So many blog
posts...  So many Next Big Thingings...

No.

No.  We don't have to do this.  We want to *script* things again.

Well, at least *I* want to script again.

I just want to toggle a class on an element!  When a click happens!

On click, toggle .open on the #menu!

Yes:

```html
<button _="on click toggle .open on the #menu">
  Menu
</button>
<ul id="menu">
  <li><a href="/">Home</a></li>
  ...
</ul>
```

That's hyperscript.  A fun little language for adding interactivity to your website.

It probably looks a little funny to you, being very English-like.  (Yeah, well *you* look funny to *it* :p)
That's because it comes from a line of programming languages known
as the [xTalk](https://en.wikipedia.org/wiki/XTalk) family, which started back in 1987 when Dan Winkler created
[HyperTalk](https://en.wikipedia.org/wiki/HyperTalk).

You'll get used to it.  And it reads very clearly, you have to admit.

hyperscript is designed to make it fun to add bits of interactivity to your web site.  It's not designed for you to
create a 50,000 lines-of-code monstrosity with routing and virtual DOM and all of that junk.  It's not good at that, and
it never will be.  (It's intentionally unscaleable.)

But if you need to respond to some events and make some small updates to the DOM, hyperscript is there for you.  It's
your buddy and it wants you to be happy, like this person:

> I literally just replaced all of existing ugly, repetitive vanilla js with what I think is the most beautiful thing I've written in a while, all hyperscript. [-mikemissing](https://github.com/bigskysoftware/_hyperscript/issues/194#issuecomment-979413577)

Things that are big and gronky and ugly in Javascript are neat and tidy in hyperscript.  Usually anyway.

And, if they aren't, maybe hyperscript isn't the right tool for that job.  That's OK too.

## hyperscript & Its Friend htmx

hyperscript is a sister project of [htmx](https://htmx.org).  htmx is all about giving HTML super powers, and it does
a [great, really great, job of that](https://htmx.org/examples).  So why do we need hyperscript, if htmx is so great?

And htmx is great.  Really great.

Well, htmx is all about interacting with the server with HTML, like we used to do back in the 1990s.  It just makes
it possible to build way cooler interfaces when doing it.  But remember how javascript used to let us do some fun
*client side* scripting?  Like we make marquees and all sorts of crazy stuff?

That's where hyperscript comes in.  It is a marquee-creating tool for the 2020s.  And beyond.

OK, that sounds ridiculous (and it is ridiculous) but let's say you want to do something *after an htmx request happens*?  That's a reasonable thing to want to do!

Maybe you want to clear a message 2 seconds after you get it from a server via htmx...

Well, htmx helpfully fires a lot of [events](https://htmx.org/events) that you can respond to, and responding to events
is hyperscript's bread and butter.  Hyperscript *loves* responding to events.

```html
<button hx-get="/message" hx-target="#messages"
        _="on htmx:afterRequest wait 2s then put '' into #messages">
  Get A Message
</button>
<div id="messages">
</div>
```

Wait a second! I can hear you screaming.  That's going to clear *all* the messages, what if you want them to clear one
at a time as each one times out?

Relax, we can do that quite easily by putting the hyperscript on the message itself instead:

```html
<div id="messages">
  <div _="on load wait 2s then remove me">
    Hyperscript is awesome...
  </div>
</div>
```

In fact, let's make that even nicer and fade it out:

```html
<div id="messages">
  <div _="on load wait 2s then transition my opacity to 0 then remove me">
    Hyperscript is *REALLY* awesome...
  </div>
</div>
```

Now the messages will wait 2 seconds, fade out and remove themselves from the page.  All nice and tidy!

## But What Does This Button *Do*?

One thing you are probably noticing by now is that we are writing our scripts directly in HTML.

This might feel bad to you, but you should feel bad for feeling bad.  ["Separation of Concerns!"](https://en.wikipedia.org/wiki/Separation_of_concerns), your inner Agile Software Consulting Coach cries out, at $300/hr.

hyperscript does not separate concerns.  Instead, it practices Locality of Behavior (LoB), which is a fancy term we made up
to help fight those $300/hr Agile Software Consulting Coaches.   It basically means: put the code on the thing that
executes the code.  That way, when you look at a thing, like a button for example, you can see what it does.

It turns out that this makes it a lot easier to understand and maintain your system.
