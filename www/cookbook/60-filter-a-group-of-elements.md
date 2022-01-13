---
title: Filter A Group Of Elements
---

You can easily filter down the visibility of a set of elements based on a condition by using the `show ... when` form
of the [`show` command](/commands/show)

```html
<input type="text" placeholder="Search Quotes..."
       _="on keyup
           if the event's key is 'Escape'
             set my value to ''
             trigger keyup
           else
            show <blockquote/> in #quotes when its textContent contains my value">
```

Here we do the search on keyup.  If the key was an escape, we reset the value of the input and rerun the event,
which shows all quotes.

<input type="text" placeholder="Search Quotes..."
       _="on keyup
           if the event's key is 'Escape'
             set my value to ''
             trigger keyup
           else
            show <blockquote/> in #quotes when its textContent contains my value">


#### Programming Quotes
<div id="quotes" style="height: 500px; overflow: scroll;">

> "Talk is cheap. Show me the code."
>
> &#8211; Linus Torvalds

> "when you don't create things, you become defined by your tastes rather than ability. your tastes only narrow & exclude people. so create."
>
> &#8211; Why The Lucky Stiff

> "Programs must be written for people to read, and only incidentally for machines to execute."
>
> &#8211; Harold Abelson, Structure and Interpretation of Computer Programs

> "Programming today is a race between software engineers striving to build bigger and better idiot>
> &#8211;proof programs, and the Universe trying to produce bigger and better idiots. So far, the Universe is winning."
>
> &#8211; Rick Cook, The Wizardry Compiled

> "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live"
>
> &#8211; John Woods

> "The best programs are written so that computing machines can perform them quickly and so that human beings can understand them clearly. A programmer is ideally an essayist who works with traditional aesthetic and literary forms as well as mathematical concepts, to communicate the way that an algorithm works and to convince a reader that the results will be correct."
>
> &#8211; Donald E. Knuth, Selected Papers on Computer Science

> "I'm not a great programmer; I'm just a good programmer with great habits."
>
> &#8211; Kent Beck

> "Give a man a program, frustrate him for a day.
      Teach a man to program, frustrate him for a lifetime."
>
> &#8211; Muhammad Waseem

> "Truth can only be found in one place: the code."
>
> &#8211; Robert C. Martin, Clean Code: A Handbook of Agile Software Craftsmanship

> "That's the thing about people who think they hate computers. What they really hate is lousy programmers."
>
> &#8211; Larry Niven

> "A language that doesn't affect the way you think about programming is not worth knowing."
>
> &#8211; Alan J. Perlis

> "The most disastrous thing that you can ever learn is your first programming language."
>
> &#8211; Alan Kay

> "Objectoriented programming offers a sustainable way to write spaghetti code. It lets you accrete programs as a series of patches."
>
> &#8211; Paul Graham, Hackers & Painters: Big Ideas from the Computer Age

> "Everyone knows that debugging is twice as hard as writing a program in the first place. So if you're as clever as you can be when you write it, how will you ever debug it?"
>
> &#8211; Brian Kernighan

</div>
