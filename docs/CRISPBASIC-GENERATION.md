# Explicit CrispBASIC generation

`sb3-creator` owns the shared generator and reverse reader. Brickwright adopts
their exact producer commit through its existing transformed-source sync.
This feature incubates on `feature/crispbasic-generator`, based deliberately on
Brickwright's existing `1c29f69fd22c86ecb0051938eedb246921cb3b88` pin. It does
not adopt unrelated newer gallery, runtime or dependency work.
It also retains the already-adopted `busch-microtronic-wired-io` gallery entry:
Brickwright carried that entry beyond its recorded old pin. Its three source
files match the published upstream versions introduced by
`312fa6b0feb72fd18fef8a6b865f708642acad9f` byte for byte; the entry itself is
retained from Brickwright's existing catalogue. This baseline reconciliation
does not add or alter a consumer example.

```js
const result = creator.generateBASIC(project, {
    profile: 'bbc', mode: 'crispbasic', lineNumbers: false
});
if (!result.ok) {
    // Show result.reasons and result.diagnostics; there is no partial BASIC.
} else {
    // Execute result.basic with an explicitly enabled CrispBASIC simulation host.
}
```

Omitting `mode`, or passing `mode: 'legacy'`, retains the existing BBC/6502
generator, including its hardware comments. Selecting the browser interpreter
alone does not select this generation mode. `crispbasic` requires `profile:
'bbc'`; numbered and structured output are both supported. Unknown modes refuse.

## Digital operations

The mode emits ordinary library calls, not new BASIC keywords or MCU registers:

| Source operation | Generated meaning |
| --- | --- |
| Digital OUTPUT declaration | `PROCpinMode(id,"output")` |
| Digital INPUT declaration | `PROCpinMode(id,"input")` |
| ACTIVE LOW INPUT declaration | `PROCpinMode(id,"input-pullup")` |
| Turn on/off | `PROCdigitalWrite` with logical ACTIVE LOW applied |
| Set high/low | Explicit electrical `1`/`0`, regardless of ACTIVE LOW |
| Computed digital write | Nonzero numeric value becomes `1`, zero becomes `0`; expression evaluated once |
| Read | `FNdigitalRead(id)`, inverted for a logical ACTIVE LOW declaration |

BBC comparison results are `-1` or `0`. The digital-write conversion explicitly
normalizes them to `1` or `0`. Boolean NOT/AND/OR in this mode similarly normalize
numeric operands before applying BBC's bitwise operators; a sensed high value
must behave as true even though it is `1`, not BBC's `TRUE` (`-1`).
Boolean reporters also retain numeric `0/1` when nested in arithmetic, with
explicit grouping. Saved projects recover pin declarations from the existing
Stage persistence metadata without mutating the input. Referenced finite
numeric scalar values are initialized from the serialized project; ambiguous
variable scopes or unsupported initial values refuse.

Logical IDs follow the existing Brickwright Circuit adapter:

| Declared device | Supported digital terminals and IDs |
| --- | --- |
| Arduino Uno / Nano | D0..D13 → 0..13; A0..A5 → 14..19 |
| Arduino Mega | D0..D53 → 0..53; A0..A15 → 54..69 |
| Pico | GP0..GP22, GP25..GP28 → their GPIO numbers |
| Recognized STC12 / STC15 / STC89 devices | P0.0..P7.7 → `8*port + bit` |

These are logical conversion maps. The active host validates which terminals
the actual board provides; a successful conversion is not evidence that every
listed terminal exists on every board package. There is no physical connection.
Unsupported devices, unmapped pins, aliases, non-digital modes, input writes,
PORT declarations and peripheral PART declarations refuse with named diagnostics.

Toggle is intentionally unsupported. `FNdigitalRead` observes the solved
electrical net, which may differ from the programmed output latch under a load
or clamp. Inverting that read would not implement output-latch toggle. Use
explicit writes or a state variable owned by the program.

## Time conversion

Wait, timed say/think and the existing timed glide lowering convert seconds to
simulated integer milliseconds. Positive durations round to the nearest
millisecond with half-millisecond ties upward: 0.0004 s → 0 ms, 0.0005 s → 1 ms,
0.025 s → 25 ms. Numeric seconds must be within `0..2147483.647`. Invalid literal
durations refuse generation; computed durations are evaluated once, checked
before the delay, and retain the owning block's generated line mappings. The
host separately enforces cumulative time and work budgets.

The timer reporter uses elapsed `FNmillis` divided by 1000. Reset timer moves a
program-owned offset; it does not rewind the simulation or alter BASIC `TIME`.
Ordinary authored BASIC `TIME` and `WAIT` retain their runtime clock semantics.
Simulation time advances only through explicit delays. `wait until` refuses
because the generator has no justified implicit polling interval; use a
repeat-until loop containing an explicit wait.

## Refusal and reverse conversion

Failures return `ok: false`, descriptive `reasons` and structured `diagnostics`,
without executable `basic`. Diagnostics have a stable `crispbasic-*` code,
severity, message, and the owning block ID/opcode where available. Unsupported
hardware, unknown reporters/statements and concurrent/event scripts must not
turn into successful comment stubs in the explicit mode. Legacy generation
retains its existing behavior. This boundary does not claim complete Scratch
language, graphics or concurrency equivalence.

`basicToPseudocode` deliberately refuses live portable pin/time calls, their
definitions and named adjacent unsupported operations. Its return value is
`{ok:false,pseudocode:'',reasons,warnings,diagnostics,stats}`. A diagnostic names
the operation, physical source line and numbered BASIC line if present. All
callers must honor that result before parsing, saving or replacing a project.
The producer CLI exits unsuccessfully and preserves an existing output file.

This is a qualified refusal boundary, not a portable-library round trip.
Ordinary supported BASIC still converts. REM consumes its full physical line,
including colons, and quoted operation names remain data. Hardware comments
never become executable portable calls.
Compact BBC keyword syntax and PROC/FN abbreviations cannot bypass the refusal.
Live `EVAL` also refuses because computed source has no qualified reverse meaning;
quoted mentions of it remain data.

## Qualification

`test/crispbasic-generator.test.mjs` exercises pin and value conversion,
milliseconds, timer reset, block diagnostics, refusal and unchanged legacy
output. `test/crispbasic-reader.test.mjs` exercises the reverse boundary and CLI
preservation; existing BASIC sweep, line-map and trace suites remain required.
`.github/workflows/crispbasic.yml` runs that bounded producer suite on the exact
feature-branch commit. Brickwright separately qualifies generated source in
the actual C/WASM interpreter, the electrical solver and its production UI.
