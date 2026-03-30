---
title: speak - ///_hyperscript
---

## The `speak` Command

### Syntax

```ebnf
speak <expression> [with voice <expression>] [with rate <expression>] [with pitch <expression>] [with volume <expression>]
```

### Description

The `speak` command uses the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
to speak text aloud — a nod to [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf).

The command is async-transparent: it waits for the utterance to finish before continuing to the next command.
You can configure `voice`, `rate`, `pitch`, and `volume` using `with` clauses.

### Examples

```html
<button _="on click speak 'Hello world'">Speak</button>

<button _="on click speak 'Fast and high' with rate 2 with pitch 1.5">Fast</button>
```
