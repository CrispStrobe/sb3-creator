# Explicit CrispBASIC generation

`sb3-creator` owns the shared generator and reverse reader. Brickwright adopts
their exact producer commit through its existing transformed-source sync.
Portable source round-trip development continues on
`feature/crispbasic-roundtrip-20261128`. Its original generator baseline was
deliberately based on Brickwright's
`1c29f69fd22c86ecb0051938eedb246921cb3b88` pin, without unrelated newer gallery,
runtime or dependency work.
The baseline also retains the already-adopted `busch-microtronic-wired-io` gallery entry:
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
| Toggle | `PROCdigitalToggle(id)` inverts the host's stored electrical output request |
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
| micro:bit / breakout | P0, P1, P2, P8, P12, P16 → their pin numbers; the actual board validates exposed pads |
| Calliope mini | P0..P3 → 0..3 |
| Circuit Playground Express (`CPX`) | A0..A7 → 0..7 (no Arduino analog offset) |
| PyBadge | D2, D3, D5, D6, D9..D13 → their digital IDs; A0..A5 → 14..19 |
| ATtiny85 | PB0..PB4 → 8..12; PB5 RESET is excluded |
| ATtiny88 DIP | PB0..PB7, PC0..PC5/PC7, PD0..PD7 → `8*port + bit`; RESET and package-only PA pads excluded |
| STM32F030 | PA0..PA7, PA9, PA10, PB1 → `16*port + bit` |
| ESP8266 | GP0..GP5, GP12..GP15 → GPIO number; flash-bus pads excluded |
| Eater6502 default VIA | PA0..PA7 → 0..7; PB0..PB7 → 8..15; custom CHIP/MAP layouts refuse |

These are logical conversion maps. The active host validates which terminals
the actual board provides; a successful conversion is not evidence that every
listed terminal exists on every board package. There is no physical connection.
Unsupported devices, unmapped pins, aliases, non-digital modes, input writes,
PORT declarations and peripheral PART declarations refuse with named diagnostics.

The PyBadge source map covers 15 independently exposed pads. SDA/SCL and STEMMA
aliases are refused, and PyBadge LC does not inherit this physical profile. The
Circuit host can also expose RX, TX, FREE, MISO, MOSI and SCK as six independent
pads; those names remain outside the source parser's existing vocabulary. Host
profile support and source-language support are therefore separate boundaries.

For `STC15F2K60S2`, DIP-40 pads P4.1, P4.2, P4.4, P4.5, P5.4 and P5.5 retain
the generic STC arithmetic and use IDs 33, 34, 36, 37, 44 and 45. The host checks
the connected package's exposed terminals, including holes in the generic map.

Toggle requires a declared digital OUTPUT. It emits one `PROCdigitalToggle(id)`
call to the host's atomic latch operation. The latch starts at electrical `0`
for each fresh run, successful digital writes replace it, and pin-mode changes
retain it. Toggle inverts that stored `0`/`1` without reading the solved net or
advancing simulated time. ACTIVE LOW changes the logical interpretation of the
result, not the toggle operation. `FNdigitalRead` continues to observe the solved
electrical net, which may differ from the output request under a load or clamp.

The generated `crispbasic-v2` banner identifies the output-latch library contract
(simulation ABI 2). Hosts without a toggle operation must refuse the call;
they must never emulate it by inverting `FNdigitalRead`. Both numbered and
structured calls retain the toggle block's source mapping. The default and
explicit legacy modes keep their existing VIA operations and hardware comments.

## Numeric procedures and calculations

The portable reverse reader accepts numeric `DEF PROCname` and
`DEF PROCname(parameter,...)` definitions after the main program's top-level
`END`. It converts them into pseudocode custom blocks, including forward calls,
nested calls and recursion. The generator recreates executable BASIC procedures.
Arguments are evaluated once, left to right, before a call enters the callee.
This matters for electrical reads and for numeric BBC Boolean values, which
remain `-1` or `0` when passed as arguments. Generated argument names avoid
collisions with authored global variables.

Procedure names and parameters must use lowercase, unsuffixed numeric names.
Parameters are read-only. The reader refuses assignments to parameters, `LOCAL`,
`BYREF`, typed or string parameters, arrays, duplicate or nested definitions,
missing or mismatched calls, and early `ENDPROC`. It also refuses a global or
free reference to a name declared as another procedure's parameter: BBC's
dynamic parameter scope cannot silently become a pseudocode global. Separate
procedures may declare the same parameter spelling because each definition
receives distinct generated argument names. Pin configuration still belongs to
the static main-program prelude; a procedure does not make dynamic pin setup
portable. Runtime recursion and work limits remain in force.

The reverse reader accepts `PI`, `SQR` and `LN`, together with the existing
arithmetic, `ABS`, `INT` and qualified Boolean expressions. `MOD` retains BBC's
integer remainder semantics, including negative operands; the portable marker
is required because ordinary Blocks modulo has different semantics.

Degree-based pseudocode trigonometry has a deliberately exact BASIC form:

| Pseudocode calculation | Qualified BASIC form |
| --- | --- |
| Sine, cosine, tangent | `SIN(RAD(x))`, `COS(RAD(x))`, `TAN(RAD(x))` |
| Inverse sine, cosine, tangent | `DEG(ASN(x))`, `DEG(ACS(x))`, `DEG(ATN(x))` |
| Square root | `SQR(x)` |
| Natural logarithm | `LN(x)` |

These wrappers preserve a single evaluation of the argument. General radian
forms are refused because a newly inserted conversion through degrees would
add floating-point operations and could change rounding. BASIC math domain
errors remain BASIC errors. The generator lowers ceiling to `-INT(-x)`, which
works for either sign and evaluates its operand once, including a sensed pin.

[The portable source guide](../reference/crispbasic-portable.md) includes a
complete reusable pulse procedure using computed waits.

## Time conversion

Wait, timed say/think and the existing timed glide lowering convert seconds to
simulated integer milliseconds. Positive durations round to the nearest
millisecond with half-millisecond ties upward: 0.0004 s → 0 ms, 0.0005 s → 1 ms,
0.025 s → 25 ms. Numeric seconds must be within `0..2147483.647`. Invalid literal
durations refuse generation; computed durations are evaluated once, checked
before the delay, and retain the owning block's generated line mappings. The
host separately enforces cumulative time and work budgets.

Reverse conversion accepts a computed wait only when it recognizes the exact
adjacent range guard and integer rounding emitted by this generator:

```basic
IF seconds<0 OR seconds>2147483.647 THEN ERROR 204,"CrispBASIC wait seconds outside 0..2147483.647"
PROCdelay(INT(seconds*1000+0.5))
```

Here `seconds` is a qualified numeric scalar or procedure parameter. Recreated
BASIC retains the guard and half-up millisecond rounding, including the error
for a negative or excessive duration. Arbitrary computed `PROCdelay` arguments
still refuse: a suggestive name or nearby unrelated check is not a range proof.
For example, 0.0015 s followed by 0.0025 s advances the host by 2 ms and then 3 ms.

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

The ordinary `basicToPseudocode(source)` path continues to refuse live portable
pin/time calls, definitions, dynamic EVAL and adjacent unsupported APIs. Existing
Blocks conversions therefore keep their fail-before-mutation contract.

An explicit source conversion is now available:

```js
const result = basicToPseudocode(source, {mode: 'crispbasic'});
if (!result.ok) showErrors(result.diagnostics);
else {
    // Store the complete source, including its requirement marker.
    savePseudocode(result.pseudocode);
    // Recompile only with {profile:'bbc', mode:'crispbasic'}.
    // result.capabilities.blocks is false: do not replace a generic VM project.
}
```

Accepted output begins with `# @crispbasic-portable 1`. The small dependency-free
`crispBasicMode.js` module provides `isCrispBasicPseudocode`, marker validation,
project validation and the shared logical-pin map. The parser retains the
requirement as `project.crispbasicSource`; decompilation and JSON serialization
retain it. Generic Python, JavaScript, C, MicroPython and SB3 generators refuse
marked projects; BASIC generation requires explicit CrispBASIC mode. Unknown,
malformed or duplicate marker versions refuse before parser reset. Consumers
must also guard their own direct block-install and runtime paths before mutation.

The reverse result exposes:

```js
capabilities: {
    pseudocode: true, blocks: false, requiredRuntime: 'crispbasic',
    simulationABI: 2, freshRun: true,
    clock: 'explicit-integer-milliseconds'
}
```

This is a portable **source round trip**, not equivalence to ordinary Scratch VM
execution or a native-machine compiler. It requires a fresh portable host and the
same pin model. The strict subset includes static matching pin-mode preludes,
electrical writes proven to produce 0/1, atomic latch toggles, solved reads with
ACTIVE LOW compensation, literal integer millisecond delays, the exact guarded
computed waits above, FNmillis, lowercase numeric scalars and numeric procedures,
the qualified math forms above, literal-count FOR loops whose counters are
private, structured IF/ELSE and WHILE, FOREVER, and the generator's recognized
numbered control-flow shapes. A delay remains explicit simulated time; FNmillis is recovered as rounded
timer milliseconds without rewinding the host. Runtime request/work budgets still
apply, and translation may add bookkeeping instructions or clock observations.

BBC comparison values are -1/0. When their numeric values are needed, the reader
emits explicit conditional assignments; it never smuggles a comparison into a
value position where the canonical parser would turn it into text. Predicates
remain inside loop conditions, so pin inputs are reread each iteration. Boolean
operands are qualified before BBC bitwise NOT/AND/OR is mapped. Digital reads are
not duplicated by normalization. Pin mode declarations must match executable
prelude calls in order; metadata alone grants no support.

Canvas conversion includes clear, palette colours 1..8 via the known pen helper,
pen up/down, integer go-to and set-x/set-y positions, and direct MOVE/DRAW on the
renderer transform's four-unit coordinate grid. Generated canvas commands retain
the same VDU bytes. Fractional/overflow coordinates, arbitrary graphics modes,
unknown plotting and altered helper bodies refuse. This does not preserve a
complete Scratch sprite/costume/animation system.

Computed pin IDs, dynamic modes, arbitrary non-0/1 writes, computed delays without
an integer/range proof, integer/string variable types, random/input statements,
observed FOR counters, arbitrary GOTO and unqualified expressions fail the whole
conversion with physical and numbered source diagnostics. No partial pseudocode
is returned. Numbered input must be complete, unique and in increasing order.
REM consumes its physical line including colons; quoted API names remain data.

The producer CLI exposes both directions deliberately:

```sh
node bin/bw.mjs transpile program.bw --to crispbasic -o program.bas
node bin/bw.mjs read program.bas --crispbasic -o program-portable.bw
node bin/bw.mjs transpile program-portable.bw --to crispbasic --numbered -o numbered.bas
```

The CLI refuses other output runtimes, native compilation, retargeting and flashing
for marked portable source. A refusal preserves an existing output file.

## Qualification

`test/crispbasic-generator.test.mjs` exercises pin and value conversion,
latch-toggle generation and source maps for both polarities and source forms,
milliseconds, timer reset, block diagnostics, refusal and unchanged legacy
output. `test/crispbasic-reader.test.mjs` exercises the reverse boundary and CLI
preservation; existing BASIC sweep, line-map and trace suites remain required.
`test/crispbasic-roundtrip.test.mjs` additionally covers strict portable
round trips, generated and authored canvas, new digital targets, negative
semantic cases, marker persistence, API guards and bidirectional CLI behavior.
`test/crispbasic-procedures.test.mjs` qualifies reusable numeric procedures,
argument evaluation, scope refusals and guarded computed waits.
`test/crispbasic-math-roundtrip.test.mjs` covers the numerical forms and signed
operand parsing. `test/crispbasic-machine-profiles.test.mjs` covers logical
source pin mappings and their narrower alias/package boundaries.
`.github/workflows/crispbasic.yml` runs the bounded producer suite on every
`feature/crispbasic-*` branch's exact commit. Brickwright separately qualifies generated source in
the actual C/WASM interpreter, the electrical solver and its production UI.

The complete focused producer command is:

```sh
node --test test/crispbasic-*.test.mjs test/basic-sweep.test.mjs test/basic-linemap.test.mjs test/basic-trace.test.mjs
```

At compiler revision
[`3b2fb01dc4a3ff6542b0836efca1dbb42b53e194`](https://github.com/CrispStrobe/sb3-creator/commit/3b2fb01dc4a3ff6542b0836efca1dbb42b53e194),
all 474 executions of that suite passed locally and in
[GitHub Actions run 46128672276](https://github.com/CrispStrobe/sb3-creator/actions/runs/46128672276),
without failed or skipped tests. Another 252 local parser, code-generation,
decompiler, round-trip and feature regressions passed. These results qualify
this source boundary; the adopting Brickwright revision must still establish
execution parity on its actual interpreter and simulator backends.
