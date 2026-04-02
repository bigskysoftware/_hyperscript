---
title: pick - ///_hyperscript
---

## The `pick` Command

This command has several forms:

- [`first` | `last` | `random`](#pick-positional)
- [`item` | `items`](#pick-items)
- [`character` | `characters`](#pick-characters)
- [`match`](#pick-match)
- [`matches`](#pick-matches)

### Pick Positional {#pick-positional}

#### Syntax

```ebnf
pick first <count> of <collection>
pick last <count> of <collection>
pick random [<count>] of <collection>
```

#### Description

Selects elements from a collection by position.

`pick first` and `pick last` return slices from the start or end. `pick random` returns a single random element, or multiple random elements (without repeats) when a count is given.

  ~~~ hyperscript
  set arr to [10, 20, 30, 40, 50]
  pick first 3 of arr    -- it = [10, 20, 30]
  pick last 2 of arr     -- it = [40, 50]
  pick random of arr     -- it = one random element
  pick random 2 of arr   -- it = two random elements
  ~~~

### Pick Items {#pick-items}

#### Syntax

```ebnf
pick items <start> [to <end>] [inclusive|exclusive] of <array>
pick item <index> of <array>
```

#### Description

Selects items from <var>array</var> using `Array.slice`. By default, it will
include <var>start</var> but not <var>end</var>. You can use `inclusive` or
`exclusive` to override this behavior. If <var>end</var> is omitted, it will
return an array containing just one item.

  ~~~ hyperscript
  set arr to [10, 11, 12, 13, 14, 15]
  pick items 2 to 4 of arr
  --      it = [12, 13]
  pick items 2 to 4 inclusive of arr
  --      it = [12, 13, 14]
  pick items 2 to 4 exclusive of arr
  --      it = [13]
  ~~~

You can use the keywords `start` or `end` for <var>start</var> and
<var>end</var>, respectively.

  ~~~ hyperscript
  pick items start to 4 of arr
  --      it = [10, 11, 12, 13]
  pick items 2 to end of arr
  --      it = [12, 13, 14, 15]
  ~~~

Note: `at`, `from`, and `..` are accepted as deprecated aliases for range syntax.

### Pick Characters {#pick-characters}

#### Syntax

```ebnf
pick characters <start> [to <end>] of <string>
pick character <index> of <string>
```

#### Description

Same as [`pick items`](#pick-items), but for strings, using `String.slice`.

### Pick Match {#pick-match}

#### Syntax

```ebnf
pick match [of] <regex> [|<flags>] of <string>
```

Selects the first match for the <var>regex</var> in the <var>string</var>.

  ~~~ hyperscript
  set str to "The quick brown fox jumps over the lazy dog."
  pick match of "the (\w+)" of str
  log it[0] -- "the lazy"
  log it[1] -- "lazy"
  pick match of "the (\w+)" | i of str
  log it[0] -- "The quick"
  log it[1] -- "quick"
  ~~~

### Pick Matches {#pick-matches}

#### Syntax

```ebnf
pick matches [of] <regex> [|<flags>] of <string>
```

Returns an iterable of all matches for the <var>regex</var> in the
<var>string</var>.

  ~~~ hyperscript
  set str to "The quick brown fox jumps over the lazy dog."
  pick matches of "the (\w+)" | i of str
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
