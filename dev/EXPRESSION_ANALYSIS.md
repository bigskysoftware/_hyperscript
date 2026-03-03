# Parse Element Standardization Analysis

## Goal

Rename `op()` → `resolve()` across all parse elements while keeping the runtime (`unifiedEval`/`unifiedExec`) as-is. This is a mechanical rename, not an architectural change.

---

## Current Architecture

### Base Class Hierarchy (`src/parsetree/base.js`)

```
ParseElement                    ← marker base class
  ├── Expression                ← evaluate() → runtime.unifiedEval(this, ctx)
  ├── Command                   ← execute() → runtime.unifiedExec(this, ctx)
  └── Feature                   ← install(target, source, args, runtime)
```

### How It Works

```
Expression.evaluate(ctx)
  → runtime.unifiedEval(this, ctx)
    → resolves this.args[] by calling .evaluate() on sub-expressions
    → calls this.op.apply(this, [ctx, ...resolvedArgs])

Command.execute(ctx)
  → runtime.unifiedExec(this, ctx)         [while(true) loop]
    → runtime.unifiedEval(command, ctx)
      → resolves this.args[]
      → calls this.op.apply(this, [ctx, ...resolvedArgs])
      → op() returns next command
    → loop continues with next command (handles Promises, errors, HALT)
```

The rename changes `this.op.apply(...)` → `this.resolve.apply(...)` at 2 call sites in `runtime.js`. Everything else is just renaming method definitions.

---

## Scope of the Rename

### Runtime Call Sites (2 changes in `src/core/runtime.js`)

| Line | Current | After |
|------|---------|-------|
| 617 | `parseElement.op.apply(parseElement, values)` | `parseElement.resolve.apply(parseElement, values)` |
| 631 | `parseElement.op.apply(parseElement, args)` | `parseElement.resolve.apply(parseElement, args)` |

### Inheritance Call (1 change in `src/parsetree/commands/setters.js`)

| Line | Current | After |
|------|---------|-------|
| 220 | `return super.op(context, root, prop, valueToSet)` | `return super.resolve(context, root, prop, valueToSet)` |

### Doc Comments (2 updates in `src/parsetree/base.js`)

| Line | Current | After |
|------|---------|-------|
| 20 | `Subclasses define op() and args for their logic.` | `Subclasses define resolve() and args for their logic.` |
| 38 | `Subclasses define op() and args for their logic.` | `Subclasses define resolve() and args for their logic.` |

### NOT to Rename — Token `.op` Property

The tokenizer sets `.op = true` on operator tokens. This is completely unrelated:
- `src/core/tokenizer.js:97` — `this.currentToken().op`
- `src/core/tokenizer.js:416` — `previousToken.op`
- `src/core/tokenizer.js:501` — `token.op = true`
- `src/core/tokenizer.js:984` — `previousToken.op`
- `src/parsetree/commands/pseudoCommand.js:64` — `lookAhead.op`
- `src/parsetree/commands/dom.js:643` — `parser.currentToken().op`
- `src/parsetree/commands/animations.js:50` — `parser.currentToken().op`

**These must NOT be renamed.**

---

## Expression `op()` Definitions to Rename (33 methods)

### `src/parsetree/expressions/expressions.js` (13 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 119 | NegativeNumber | `resolve(context, value)` |
| 158 | LogicalNot | `resolve(context, val)` |
| 305 | PropertyAccess | `resolve(context, rootVal)` |
| 384 | OfExpression | `resolve(context, rootVal)` |
| 463 | PossessiveExpression | `resolve(context, rootVal)` |
| 517 | InExpression | `resolve(context, rootVal, target)` |
| 587 | AsExpression | `resolve(context, rootVal)` |
| 643 | FunctionCall | `resolve(context, firstArg, argVals)` |
| 700 | AttributeRefAccess | `resolve(_ctx, rootVal)` |
| 793 | ArrayIndex | `resolve(_ctx, root, firstIndex, secondIndex)` |
| 865 | MathOperator | `resolve(context, lhsVal, rhsVal)` |
| 1042 | ComparisonOperator | `resolve(context, lhsVal, rhsVal)` |
| 1174 | LogicalOperator | `resolve(context, lhsVal, rhsVal)` |

### `src/parsetree/expressions/webliterals.js` (7 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 18 | IdRefTemplateNode | `resolve(context, arg)` |
| 80 | ClassRefTemplateNode | `resolve(context, arg)` |
| 148 | QueryRefNode | `resolve(context, ...args)` |
| 211 | AttributeRefNode | `resolve(context)` |
| 265 | ComputedStyleRefNode | `resolve(context)` |
| 283 | StyleRefNode | `resolve(context)` |
| 328 | StyleLiteralNode | `resolve(ctx, exprs)` |

### `src/parsetree/expressions/literals.js` (5 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 198 | StringLiteral | `resolve(context)` |
| 258 | ArrayLiteral | `resolve(context, values)` |
| 304 | ObjectKey | `resolve(ctx, expr)` |
| 362 | ObjectLiteral | `resolve(context, keys, values)` |
| 420 | NamedArgumentList | `resolve(context, values)` |

### `src/parsetree/expressions/positional.js` (3 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 148 | RelativePositionalExpression | `resolve(context, thing, from, inElt, withinElt)` |
| 211 | PositionalExpression | `resolve(context, rhsVal)` |
| 251 | ClosestExprNode | `resolve(ctx, to)` |

### `src/parsetree/expressions/postfix.js` (3 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 28 | StringPostfixExpressionNode | `resolve(context, val)` |
| 66 | TimeExpressionNode | `resolve(context, val)` |
| 103 | TypeCheckExpressionNode | `resolve(context, val)` |

### `src/parsetree/expressions/existentials.js` (2 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 36 | NoExpression | `resolve(context, val)` |
| 69 | SomeExpression | `resolve(context, val)` |

---

## Command `op()` Definitions to Rename (52 methods)

### `src/parsetree/commands/basic.js` (15 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 34 | LogCommand | `resolve(context, value)` |
| 59 | BeepCommand | `resolve(ctx)` |
| 99 | ThrowCommand | `resolve(ctx, expr, args)` |
| 146 | ReturnCommand | `resolve(ctx, withExpr, values)` |
| 188 | ExitCommand | `resolve(ctx, values)` |
| 227 | HaltCommand | `resolve(ctx, expr)` |
| 266 | MakeQueryRefCommand | `resolve(context, value)` |
| 308 | MakeConstructorCommand | `resolve(context, value)` |
| 367 | AppendCommand | `resolve(ctx)` |
| 475 | AppendCommand (setter) | `resolve(context, target, value)` |
| 537 | PickCommandRange | `resolve(ctx, root, from, to)` |
| 558 | PickCommandMatch | `resolve(ctx, root, re)` |
| 575 | PickCommandMatches | `resolve(ctx, root, re)` |
| 669 | FetchCommandNode | `resolve(context, url, args)` |
| 797 | GoCommandNode | `resolve(ctx, to, offset)` |

### `src/parsetree/commands/dom.js` (11 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 121 | AddCommandClass | `resolve(context, to, classRefs)` |
| 159 | AddCommandAttribute | `resolve(context, to, attrRef)` |
| 195 | AddCommandCSS | `resolve(context, to, css)` |
| 269 | RemoveCommandElement | `resolve(context, element, from)` |
| 294 | RemoveCommandClassOrAttr | `resolve(context, classRefs, from)` |
| 487 | ToggleCommand | `resolve(context, on, time, evt, from, classRef, classRef2, classRefs)` |
| 551 | HideCommand | `resolve(ctx, target)` |
| 612 | ShowCommand | `resolve(ctx, target)` |
| 682 | TakeCommandClass | `resolve(context, classRefs, from, forElt)` |
| 716 | TakeCommandAttribute | `resolve(context, from, forElt, replacementValue)` |
| 819 | MeasureCommand | `resolve(ctx, target)` |

### `src/parsetree/commands/setters.js` (8 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 20 | IncrementOperation | `resolve(context, targetValue, amount)` |
| 41 | DecrementOperation | `resolve(context, targetValue, amount)` |
| 94 | BaseSetterCommand | `resolve(context, root, prop, valueToSet)` |
| 211 | SetCommand | `resolve(context, root, prop, valueToSet)` |
| 220 | (super call) | `super.resolve(context, root, prop, valueToSet)` |
| 265 | DefaultCommand | `resolve(context, targetValue)` |
| 433 | PutCommand | `resolve(context, root, prop, valueToPut)` |

### `src/parsetree/commands/controlflow.js` (7 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 18 | IfCommand | `resolve(context)` |
| 52 | RepeatInitCommand | `resolve(context, whileValue, times)` |
| 108 | RepeatLoopCommand | `resolve(context, value, event, on)` |
| 189 | ContinueCommand | `resolve(context, exprValue)` |
| 357 | BreakCommand | `resolve(context)` |
| 395 | TellCommand | `resolve(context)` |
| 461 | WaitATick | `resolve(context, value)` |

### `src/parsetree/commands/execution.js` (4 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 102 | JsCommand | `resolve(context)` |
| 161 | AsyncCommand | `resolve(context)` |
| 199 | CallCommand | `resolve(context, result)` |
| 232 | GetCommand | `resolve(context, result)` |

### `src/parsetree/commands/events.js` (3 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 45 | WaitCommandEvent | `resolve(context, on)` |
| 88 | WaitCommandTime | `resolve(context, timeValue)` |
| 183 | SendCommand | `resolve(context, to, eventName, details)` |

### `src/parsetree/commands/animations.js` (2 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 105 | SettleCommand | `resolve(context, on)` |
| 217 | TransitionCommand | `resolve(context, targets, properties, from, to, using, over)` |

### `src/parsetree/commands/pseudoCommand.js` (2 methods)

| Line | Class | Rename to |
|------|-------|-----------|
| 17 | PseudoCommandWithTarget | `resolve(context, rootRoot, args)` |
| 40 | PseudoCommandSimple | `resolve(context, result)` |

### `src/parsetree/features/install.js` (1 method)

| Line | Class | Rename to |
|------|-------|-----------|
| 25 | BehaviorInstallOperation | `resolve(ctx, args)` |

---

## Expressions That Override `evaluate()` Directly — Deep Analysis

12 expressions have no `op()` method and override `evaluate()` directly. Investigation reveals two distinct categories:

### Cannot Use Standard Pattern (2 expressions)

These genuinely need the `evaluate()` override — converting to `resolve()` would break them:

| Class | File | Why |
|-------|------|-----|
| BlockLiteral | expressions/expressions.js | Returns an **unevaluated function** (closure). Using resolve() would cause `unifiedEval` to eagerly evaluate the inner expression, destroying the lambda semantics. The whole point is deferred evaluation. |
| AsyncExpression | expressions/expressions.js | Returns `{asyncWrapper: true, value}` marker object. `unifiedEval` specifically detects and handles this marker (runtime.js:577,589). If this went through resolve(), the framework would mishandle the wrapper. |

### Should Be Converted to Standard `resolve()` Pattern (10 expressions)

These override `evaluate()` for no good reason — they have no child expressions and just return computed values. They should be converted to use `resolve()` + empty `args` for consistency.

| Class | File | Current evaluate() Body | Conversion |
|-------|------|------------------------|------------|
| SymbolRef | expressions/expressions.js | `return ctx.meta.runtime.resolveSymbol(this.name, ctx, this.scope)` | Trivial — existing TODO asks "Why is this not using op?" |
| DotOrColonPathNode | expressions/expressions.js | `return this.path.join(this.separator \|\| "")` | Trivial — existing TODO asks same question |
| BeepExpression | expressions/expressions.js | Evaluates inner expr, logs it, returns value | Straightforward — inner expr becomes `args[0]` |
| PseudopossessiveIts | expressions/pseudopossessive.js | `return ctx.meta.runtime.resolveSymbol("it", ctx)` | Trivial — no args |
| NakedString | expressions/literals.js | `return this.tokens.map(t => t.value).join("")` | Trivial — no args, pure data |
| BooleanLiteral | expressions/literals.js | `return this.value` | Trivial — no args |
| NullLiteral | expressions/literals.js | `return null` | Trivial — no args |
| NumberLiteral | expressions/literals.js | `return this.value` | Trivial — no args |
| IdRefNode | expressions/webliterals.js | `return ctx.meta.runtime.getRootNode(ctx.me).getElementById(this.value)` | Trivial — no args |
| ClassRefNode | expressions/webliterals.js | `return new ElementCollection(this.css, ctx.me, true, ctx.meta.runtime)` | Trivial — no args |

---

## Hybrid Expressions — Deep Analysis

4 expressions have both `op()` and `evaluate()`. Here's why and what to do:

| Class | File | Why Both | Action |
|-------|------|----------|--------|
| LogicalOperator | expressions/expressions.js | `evaluate()` passes `shortCircuitOnValue` param to `unifiedEval` — for `or`, short-circuits when LHS is truthy; for `and`, when LHS is falsy. `op()` does the actual `&&`/`\|\|`. | **Keep both.** Rename `op()` → `resolve()`. The `evaluate()` override is necessary for correctness. |
| StringLiteral | expressions/literals.js | `evaluate()` checks `this.args.length === 0` — if no template interpolation, returns `this.rawValue` directly without calling `unifiedEval`. Otherwise delegates to `unifiedEval` → `op()` which concatenates. | **Keep both.** Rename `op()` → `resolve()`. The optimization shortcut is worth keeping. |
| ObjectKey | expressions/literals.js | `evaluate()` checks `this.expr` — if null (static key), returns `this.key` directly. If computed, delegates to `unifiedEval` → `op()`. | **Keep both.** Rename `op()` → `resolve()`. Same optimization pattern as StringLiteral. |
| ClosestExprNode | expressions/positional.js | `evaluate()` just calls `ctx.meta.runtime.unifiedEval(this, ctx)` — identical to base class. | **Remove evaluate() override.** It's redundant. Just rename `op()` → `resolve()`. |

---

## Factory/Parser Expression Classes — Elimination Analysis

These are static-only classes with just a `parse()` method that return other node types. Goal: eliminate the indirection.

### Easy to Eliminate — 1:1 Node Mapping (6 classes)

Each factory creates exactly one node type. Merge `parse()` into the node class, rename node to take the factory's name.

| Factory Class | File | Node Class | Action |
|---------------|------|------------|--------|
| StringPostfixExpression | expressions/postfix.js | StringPostfixExpressionNode | Merge → rename node to `StringPostfixExpression` |
| TimeExpression | expressions/postfix.js | TimeExpressionNode | Merge → rename node to `TimeExpression` |
| TypeCheckExpression | expressions/postfix.js | TypeCheckExpressionNode | Merge → rename node to `TypeCheckExpression` |
| QueryRef | expressions/webliterals.js | QueryRefNode | Merge → rename node to `QueryRef` |
| AttributeRef | expressions/webliterals.js | AttributeRefNode | Merge → rename node to `AttributeRef` |
| StyleLiteral | expressions/webliterals.js | StyleLiteralNode | Merge → rename node to `StyleLiteral` |

### Grammar Routing — Not Real Classes (3 classes)

These just call `parser.parseAnyOf(...)` to dispatch. They're grammar rules, not classes.

| Factory Class | File | parse() Body | Action |
|---------------|------|-------------|--------|
| MathExpression | expressions/expressions.js | `parser.parseAnyOf(["mathOperator", "unaryExpression"])` | Could become a plain grammar entry or stay as-is — no instances are ever created |
| ComparisonExpression | expressions/expressions.js | `parser.parseAnyOf(["comparisonOperator", "mathExpression"])` | Same |
| LogicalExpression | expressions/expressions.js | `parser.parseAnyOf(["logicalOperator", "mathExpression"])` | Same |

### Branch to Multiple Node Types (5 classes)

These create different node types based on parsing context (e.g., template vs static).

| Factory Class | File | Node Types | Action |
|---------------|------|-----------|--------|
| IdRef | expressions/webliterals.js | IdRefNode \| IdRefTemplateNode | Could merge into single class with template flag, or keep two classes with shared `parse()` on one |
| ClassRef | expressions/webliterals.js | ClassRefNode \| ClassRefTemplateNode | Same pattern as IdRef |
| StyleRef | expressions/webliterals.js | StyleRefNode \| ComputedStyleRefNode | Simple branch on "computed-" prefix |
| ClosestExpr | expressions/positional.js | ClosestExprNode (+ optional attributeRef wrapping) | Complex — keep factory or move parse into ClosestExprNode |
| DotOrColonPath | expressions/expressions.js | DotOrColonPathNode | 1:1 but listed here because DotOrColonPathNode has its own issues (evaluate override, TODO) |

### Special Case (1 class)

| Factory Class | File | Action |
|---------------|------|--------|
| ParenthesizedExpression | expressions/expressions.js | Returns inner expression directly (unwraps parens). No node type of its own. Must stay as-is. |

---

## Empty `evaluate()` Stubs

~15 expressions have empty comment-block stubs for `evaluate()` that do nothing (they rely on the inherited base class `evaluate()`). These should be **removed** as cleanup during the rename.

Found in: `expressions/positional.js`, `expressions/expressions.js`, `expressions/literals.js`

---

## Summary

### Rename Scope

| What | Count |
|------|-------|
| Runtime call sites to update | 2 |
| `super.op()` calls to update | 1 |
| Doc comments to update | 2 |
| Expression `op()` → `resolve()` renames | 33 |
| Command `op()` → `resolve()` renames | 52 |
| Feature `op()` → `resolve()` renames | 1 |
| Token `.op` properties (DO NOT RENAME) | 7 |
| **Total method renames** | **88** |

### Expression Standardization (beyond rename)

| What | Count |
|------|-------|
| `evaluate()` overrides to convert to `resolve()` | 10 |
| `evaluate()` overrides that must stay (BlockLiteral, AsyncExpression) | 2 |
| Hybrid expressions — keep both methods | 3 |
| Hybrid expressions — remove redundant `evaluate()` | 1 |
| Factory classes to eliminate (merge into node) | 6 |
| Grammar routing classes (leave as-is or simplify) | 3 |
| Multi-branch factories (need design decision) | 5 |
| ParenthesizedExpression (must stay) | 1 |
| Empty stubs to remove | ~15 |