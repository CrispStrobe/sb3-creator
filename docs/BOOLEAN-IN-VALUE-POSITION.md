# `not <cond>` in value position — decision memo

Written 2026-08-29 (fab-sbx), for the owner of the dialect.
Status: **RECOMMENDATION — do not implement a value form.** The OPEN DEFECT
sentinel in `test/bare-condition-truth.test.mjs` stays standing until this is
decided, and if the recommendation is accepted the sentinel is replaced rather
than deleted (see "If accepted", below).

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
