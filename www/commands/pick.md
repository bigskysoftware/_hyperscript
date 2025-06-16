---
title: pick - ///_hyperscript
---

## The `pick` Command

This command has several forms:

- [`item` | `items`](#pick-items)
- [`character` | `characters`](#pick-characters)
- [`match`](#pick-match)
- [`matches`](#pick-matches)

### Pick Items {#pick-items}

#### Syntax

{%syntax "pick items at|from[[?]] from[[?]] [[start]] to [[end]] inclusive|exclusive[[?]] from [[array]]"%}

{%syntax "pick item at[[?]] [...]"%}

#### Description

Selects items from <var>array</var> using `Array.slice`. By default, it will
include <var>start</var> but not <var>end</var>. You can use `inclusive` or
`exclusive` to override this behavior. If <var>end</var> is omitted, it will
return an array containing just one item.

  ~~~ hyperscript
  set arr to [10, 11, 12, 13, 14, 15]
  pick items 2 to 4 from arr
  --      it = [12, 13]
  pick items 2 to 4 inclusive from arr
  --      it = [12, 13, 14]
  pick items 2 to 4 exclusive from arr
  --      it = [13]
  ~~~

You can use the keywords `start` or `end` for <var>start</var> and
<var>end</var>, respectively.

  ~~~ hyperscript
  pick items from start to 4 from arr
  --      it = [10, 11, 12, 13]
  pick items from 2 to end from arr
  --      it = [12, 13, 14, 15]
  pick items from start to end from arr
  --      it = [10, 11, 12, 13, 14, 15]
  ~~~

### Pick Characters {#pick-characters}

#### Syntax

{%syntax "pick characters [...]"%}

{%syntax "pick character [...]"%}

#### Description

Same as [`pick items`](#pick-items), but for strings, using `String.slice`.

### Pick Match {#pick-match}

#### Syntax

{%syntax "pick match of[[?]] [[regex]] | [[flags]][[?]] from [[string]]"%}

Selects the first match for the <var>regex</var> in the <var>string</var>.

  ~~~ hyperscript
  set str to "The quick brown fox jumps over the lazy dog."
  pick match of "the (\w+)" from str
  log it[0] -- "the lazy"
  log it[1] -- "lazy"
  pick match of "the (\w+)" | i from str
  log it[0] -- "The quick"
  log it[1] -- "quick"
  ~~~

### Pick Matches {#pick-matches}

#### Syntax

{%syntax "pick matches of[[?]] [[regex]] | [[flags]][[?]] from [[string]]"%}

Returns an iterable of all matches for the <var>regex</var> in the
<var>string</var>.

  ~~~ hyperscript
  set str to "The quick brown fox jumps over the lazy dog."
  pick match of "the (\w+)" | i from str
  repeat for match in result index i
    log `${i}:`
    log it[0] -- "The quick"
    log it[1] -- "quick"
  end
  ~~~
  Output:
  ~~~
  0:
  The quick
  quick
  1:
  the lazy
  lazy
  ~~~
