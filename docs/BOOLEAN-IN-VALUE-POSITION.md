# `not <cond>` in value position — decision memo

Written 2026-08-29 (fab-sbx), for the owner of the dialect.
Status: **IMPLEMENTED 2026-10-06 (task D7), for every Boolean form — see "The
rule" directly below.** The memo that follows is the reasoning, kept as written;
its "What was NOT done here" section is what D7 did.

## The rule (task D7)

**A value position reads the VALUE grammar.**

1. A **Boolean reporter word** is part of the value grammar and is a value: its
   block in a round slot, as Scratch allows a hexagon there. These are the
   micro:bit words (`button a pressed`, `read button_a`, `shake happening`,
   `pin P0 touched`, `pin P0 is high`, `logo touched`, `game is over|running|
   paused`, `point x … y …`, `pixel x … y … of image …`, the LED-sprite
   Booleans), SPIKE (`spike force sensor A pressed`, `spike button left
   pressed`, `spike gesture …`, `spike color A is red`), MATRIX8X8 (`pixel X Y is
   on`), every Boolean word of the EV3 table and of the Arcade / array-reference
   table (incl. `compare value (a) op "<" with (b)` and `truthiness of value …`,
   which exist to store a truth value), and a Boolean custom-block parameter.
2. **Every form of the CONDITION grammar has no value form**: a comparison
   (`=`, `!=`, `<`, `>`, `<=`, `>=`), `and` / `or` / `not`, and the predicate
   phrases (`touching …`, `touching color …`, `key … pressed[?]`, `mouse
   down[?]`, `… contains …`, `array "…" contains …`, `… is multiple of …`,
   `"…" pressed?`, `… above …`, `… closer than …`, `motion detected on …`,
   `… tilted?`, `… energised?`, the keypad phrases `a key is pressed` / `key N is
   pressed|released`). In a value position such a form is **kept as the literal
   text, with one warning** — `"<form>" is a COMPARISON` (a top-level
   comparison) or `is a CONDITION used where a value is expected …; to keep a
   truth value in a variable, branch on it and assign 1 or 0` — never a phantom
   variable, never silence. That is this memo's option 4, applied to the whole
   condition grammar rather than to `not` alone.
3. **The discriminator is narrow** (this memo's false-positive concern): a name
   the program has, or writes anywhere in the source (`set not found to 1`), is
   that name; and `and` / `or` / `not` over names nothing has (`not found`,
   `salt and pepper`, with `found` / `salt` named nowhere) is a multi-word name,
   not a condition over phantoms. `not done` with `done` a variable IS a
   condition.
4. A slot that TAKES a condition (an Arcade `{…:cond}` / `{…:bool}` slot, a
   custom block's `<…>` argument, `IF`, `wait until`, `REPEAT UNTIL`) takes every
   condition form.
5. The decompiler writes a Boolean block of the condition grammar that a
   Scratch project holds in a ROUND slot as its condition (`say (a > b)`), so
   re-reading it warns under rule 2 instead of reading the opcode back as a
   variable called `operator_gt`.

Implemented in `src/utils/sb3Creator.js` (`booleanFormKind`,
`warnBooleanAsValue`, the two call sites in `parseValue`, `arcadeConditionLike`,
`dcondWord`); the Arduino reader emits the branch form (`setLinesFor` in
`src/utils/cToPseudocode.js`). Held by `test/dialect-boolean-value.test.mjs`
(every form x every value position, form by form, the round trip, the
decompiler) and `test/bare-condition-truth.test.mjs` (the four backends refuse
identically; the reader's branch form).

### Why the reporter words keep their value form

The table below shows the dialect never had ONE rule: reporter words were
values while conditions were text, warned or silent. Rule 1 does not undo the
reporter words, because they are the dialect's deliberate spelling for a stored
truth value (E0 added `compare value … op … with …` precisely so an importer
stops writing `(0 < 1)` in value positions), and a MakeCode program that stores
`input.buttonIsPressed(Button.A)` has nothing else to say. The cost this memo
named is real for them: what a stored truth value prints differs by target
(Scratch `true`, Python `True`, C `1`). The branch form remains the one
portable spelling.

### Before → after, every form in every value position

Driven by `test/helpers/boolean-value-census.mjs`: 75 forms (16 operator, 20
predicate, 39 reporter) in 434 value positions (every value slot of every
`parseCommand` statement rule, every value slot of the EV3 and Arcade command
words, a custom-block argument, an operand of `+` and of `join`), bracketed,
and bare where the slot ends the line — 38,260 cells. "no baseline" is a
position whose instance cannot hold that form's device preamble.

| forms | before (a69547b7) | after |
|---|---|---|
| operator (comparisons, and/or/not) | text+warning 5,181 · **text SILENT 2,855** · **variable SILENT 978** · refused 322 | text+warning 9,014 · refused 322 |
| predicate (touching, key, mouse, contains, device, keypad) | **variable SILENT 6,420** · **text SILENT 4,566** · text+warning 24 · refused 384 · other 2 · no baseline 222 | text+warning 10,436 · other+warning 574 (`touching mouse-pointer`: the `-` splits first; `touching mouse` warns) · refused 384 · other 2 · no baseline 222 |
| reporter words | value 16,841 · refused 458 · other 1 · no baseline 6 | unchanged |

(The "text+warning" cells before were comparisons and unbracketed `and`/`or`/
`not` over one; three predicate positions warned for an unrelated reason —
`play sound X` names an undeclared sound.)

## The question

`set x to not <cond>` is currently swallowed as a variable name. Measured at
`86a5bab`, with `PIN btn = D2 INPUT ACTIVE LOW`:

```
set raw to not read btn
```

| backend | emitted | warnings |
|---|---|---|
| device C | `raw = not_read_btn;` | none |
| host C | same phantom global | none |
| JavaScript | `raw = not_read_btn;` | none |
| Python | `raw = not_read_btn` | none |

Four backends, one phantom global that nothing writes, zero warnings. The
identifier rule `^[a-zA-Z_][a-zA-Z0-9_\s]*$` matches `not read btn`, so the
string never reaches the fallback that would have questioned it.

It matters more than a typo would, because **this repo's own Arduino reader
emits the shape**. `cToPseudocode` turns

```c
void setup() { pinMode(2, INPUT_PULLUP); }
void loop()  { int sensorVal = digitalRead(2); }
```

into `PIN d2 = D2 INPUT ACTIVE LOW` + `set sensorVal to not read d2`. That is
semantically right and syntactically unreadable: `digitalRead` returns the RAW
level, `read d2` on an active-low pin returns the LOGICAL one, and the reader
has to undo the polarity it just declared. So the importer's round trip is not
faithful, and `arduino-import.test.mjs` cannot see it — it checks for warnings,
and a silent swallow produces none.

## Why the obvious fix is not available

A boolean in value position must be given a value, and the two halves of this
project disagree about which:

- **Scratch** stores the STRINGS `"true"` / `"false"`. That is not a detail we
  chose; it is what the VM does, and `boolishTruthTest` (the D26 fix) treats
  Scratch's own cast as authoritative everywhere else.
- **Every C target** stores `1` / `0` in a `long`. A string is not
  representable on the chip.

So there is no single stored value that both halves can carry. Pick the
strings and the device C cannot compile them; pick `1/0` and Scratch diverges
from Scratch, and `print x` prints `1` where the same project in the browser
prints `true`. That divergence-on-`print` is precisely the disease D26 was:
four backends reading one shape four ways.

**The DoD condition for implementing — one spelling that round-trips faithfully
AND all backends agreeing — cannot be met.** Not for lack of effort: the two
required answers are contradictory.

## Why a value form would also be a second spelling

The dialect already expresses this meaning, and the compiler already says so.
`set flag to (val > 5)` — a comparison in value position, the same shape one
operator over — warns today:

> `"val > 5"` is a COMPARISON used where a value is expected, and it is emitted
> as the literal text rather than evaluated. Comparisons belong in a condition
> (`IF …`, `wait until …`); **to keep a truth value in a variable, branch on it
> and assign 1 or 0.**

That last clause IS the dialect's answer for booleans in value position. Adding
`set x to not <cond>` would give one meaning two spellings while `decompile`
emits one — the exact reason D26 REFUSED the prefix `bitand a b` form rather
than accepting it. Refusing here is the consistent ruling, not a lesser one.

## Options considered

| # | option | cost | verdict |
|---|---|---|---|
| 1 | Store Scratch's `"true"`/`"false"` everywhere | device C cannot hold a string in a `long`; every arithmetic use of the variable breaks | rejected — not implementable on the chip |
| 2 | Store `1`/`0` everywhere | Scratch stops behaving like Scratch; `print` disagrees with the browser; contradicts `boolishTruthTest`'s premise | rejected — reintroduces D26 |
| 3 | Store `1`/`0` on C targets and `"true"`/`"false"` on Scratch | the four-backend agreement test cannot be extended to value position, because they would not agree | rejected — the DoD's own bar |
| 4 | **Refuse it, and name the branch form** | one warning, plus a faithful `cToPseudocode` emission | **RECOMMENDED** |
| 5 | Leave it silent | the importer keeps emitting unreadable output and nothing says so | rejected — this is the status quo the sentinel exists to end |

## The recommendation, in full

**Refuse `not <cond>` in value position, with the warning the comparison case
already uses**, so the dialect has one rule for one meaning. Concretely:

1. In `parseValue`'s identifier branch, beside the existing `PREFIX_BITOP`
   refusal, warn when the string is a boolean form rather than a name. The
   discriminator has to be **narrow**, and that is the one piece of real design
   work here: `not read btn` must warn while an ordinary variable called
   `not found` must not. The precedent's own test asserts that ordinary
   multi-word names are untouched, and the same test is owed here. The
   proposed rule is "`^not\s+` AND the remainder resolves to a reporter", not
   "`^not\s+`" alone — a bare `not found` resolves to a variable, not a
   reporter, and must stay a name.
2. Repair `cToPseudocode` so its round trip is faithful. It should emit the
   branch form the warning names:
   ```
   IF read d2 THEN:
     set sensorVal to 0
   ELSE:
     set sensorVal to 1
   ```
   which re-parses, means exactly what `digitalRead` meant, and needs no new
   dialect. Verbose, and correct.
3. Then replace the sentinel per its own instruction. It says "DELETE THIS TEST
   when the form is supported"; the form would be REFUSED, not supported, so
   the honest successor asserts the refusal and the faithful re-import, and
   `docs/WAVE-OPEN-DEFECTS.md`'s D26 row is re-worded rather than closed.

## What was NOT done here, and why

Steps 1–3 are not implemented in this pass. Step 1 is a change to the
identifier rule that every program in the corpus goes through, and getting the
discriminator wrong turns a legitimate variable name into a warning across 280
programs. That deserves its own commit with its own false-positive sweep, and
this lane's remit was to decide, not to spend the corpus's quiet on a guess.

The sentinel therefore stands, and it is still accurate: nothing warns, and the
emitted C still reads `raw = not_read_btn;`.

## If accepted

The successor test belongs beside the four-backend agreement table in
`test/bare-condition-truth.test.mjs`, and the row it adds is not "all four
backends compute the same value" — it is **"all four backends refuse
identically"**, which is the only agreement available and is worth asserting
for the same reason the positive one was.
