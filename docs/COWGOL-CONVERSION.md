# Cowgol and Brickwright Code

The shared producer now provides `creator.generateCowgol(project, opts)` and
the default `cowgolToPseudocode(source, opts)` reader. Brickwright consumes
these files through its existing pinned, transformed-source sync. The command
line and embedded host entry points use the same implementation.

```sh
node bin/bw.mjs transpile example.bw --to cowgol -o example.cow
node bin/bw.mjs read example.cow -o imported.bw
```

Both conversions return an `ok` flag. Successful generation includes `cowgol`,
`warnings`, `diagnostics`, `stats`, and a generated-line-to-block-ID `lineMap`.
The reader returns `pseudocode`, `warnings`, `diagnostics`, and `stats`.
On refusal, generation returns no `cowgol`, and the reader returns an empty
`pseudocode`. The `preview` field retains inspectable source, and `reasons`
names the first or all unsupported operations. Callers must check `ok` before
running or replacing a program. The CLI exits unsuccessfully and preserves an
existing output file when conversion refuses.

## Executable conversion subset

| Area | Supported conversion |
| --- | --- |
| Program entry | One `WHEN flag clicked` script; Stage or one sprite |
| Numbers | Explicit signed `int32`; integer addition, subtraction, multiplication and AND/OR/XOR bit operations |
| Text | Literal text and text variables; quotes, backslashes, newline, CR, tab and UTF-8 |
| Control flow | Assignments, changes, IF/ELSE, repeat count, repeat-until and forever |
| Conditions | Numeric comparisons; short-circuit `and`, `or`, `not` |
| Output | `bw_print_number` and `bw_print_text` host/console calls |
| Turtle canvas | Clear, pen up/down, literal RGB24 colour, integer pen size, go-to XY, move, turn, direction, change/set XY, X/Y/direction reporters |
| Digital circuit | Declared digital pins, mode setup, electrical writes, active-low logical operations, reads and output-latch toggle |
| Timing | Literal seconds exported as rounded integer milliseconds; milliseconds imported as seconds |
| Exit | `stop all` ↔ `Exit()` |

The generated source includes `cowgol.coh` and `brickwright.coh`. Its calls are
ordinary Cowgol procedures. The fork's `cgen` target requires an explicit host
implementation; missing callbacks produce link errors. Console-only programs
can use the fork's CP/M and DOS `brickwright.coh` console wrappers. Graphics and
circuit calls require the corresponding host binding; a generic Cowgol compiler
backend does not provide those bindings by itself.

`bw_digital_toggle` inverts the stored electrical output request. It never
inverts a fresh input measurement: a loaded or clamped circuit can read a value
different from the requested output level. Active-low declarations invert
logical on/off and input reads, while explicit high/low remain electrical.

The reader accepts hand-written code in the same subset, including semicolon
statements, comments, `elseif`, and simple nonrecursive typed procedures with
no result or early return. Procedure generation remains a named refusal, as
do event/concurrent programs, extra sprites, extra costumes and sounds, lists,
arrays, arbitrary pointers, casts, assembly, dynamic includes, arbitrary host
calls, and unported peripheral `PART`/`PORT` declarations. Native Cowgol source
outside this subset can still be compiled by the Cowgol toolchain; it simply
cannot be claimed as a qualified pseudocode conversion.

Standard Cowgol `print`/`print_i32` byte-stream routines have not been mapped
to pseudocode message output: its chunk/newline behavior differs. Use the
explicit `bw_print_*` bridge for conversion. The larger native ABI's rectangle,
pixel, circle and text-drawing calls likewise remain native host operations;
the converter currently maps the shared turtle API.

## Numeric and text boundaries

Cowgol's integer arithmetic wraps at its declared width; Scratch pseudocode
uses a wider numeric model. The supported conversion profile requires **all
intermediate numeric values to remain within signed 32-bit range**. Both APIs
return this qualification as a warning, rather than claiming general integer
equivalence. The reader rejects provable straight-line overflow, int32-minimum
negation, and narrower/unsigned declarations. Unknown loop bounds or external
input values are not proofs of absence of overflow. They retain the explicit
profile warning. `-2147483648` itself is valid and round-trips.

Division/remainder, floating point, arbitrary math and Boolean values used as
numeric values are refused. Cowgol conditions exist only in `if`/`while`, and
the reader rejects scalar truthiness that the real Cowgol compiler rejects.
Untyped numeric constants cannot infer a Cowgol variable type; use `int32`.
Uninitialized Cowgol variables do not have a deterministic pseudocode default
and therefore refuse. Computed initializers become runtime `set` statements.
All initializers execute again on green flag, matching a fresh Cowgol run.

Cowgol's lexer accepts at most **127 UTF-8 bytes per string literal**. Conversion
checks bytes, not JavaScript UTF-16 length. It refuses embedded NUL, unsupported
control characters, unpaired surrogates, and unsupported escape spellings such
as JSON `\uNNNN`, `\b` or `\f`. Numeric-looking text such as `"001"` remains text.

## Digital pin coordinate maps

These maps define the integer IDs passed to the host callbacks. They are
conversion contracts, not claims that a native Cowgol firmware backend exists
for every board. The actual host validates its connected terminals.

| Declared device | Accepted digital coordinates | Host IDs |
| --- | --- | --- |
| Uno, Nano, ATmega168P/328P | D0–D13, A0–A5 | 0–13, 14–19; Nano A6/A7 remain analog-only |
| Mega | D0–D53, A0–A15 | 0–53, 54–69 |
| Pico | GP0–GP22, GP25–GP28 | GPIO number |
| ESP8266 | GP0–GP5, GP12–GP15 | GPIO number; excludes flash bus and unsupported GP16 |
| micro:bit / Calliope Mini | P0–P16, P19, P20; BUTTON_A/B inputs | Edge number; buttons alias P5/P11 |
| ATtiny85 | PB0–PB4 | 8–12; PB5 RESET excluded |
| ATtiny88 | PB0–PB7, PC0–PC5/PC7, PD0–PD7 | `8*port + bit`, port A=0; PC6 RESET excluded |
| Eater 6502 | PA0–PA7, PB0–PB6 | A=0–7, B=8–14; timer-owned PB7 excluded |
| Z80 | OUT0–OUT7, IN0–IN7 | Outputs=0–7, inputs=8–15; fixed directions, no virtual MK keys |
| 8086 with 8255 | P1.0–P3.7 | Ports A/B/C=0–7/8–15/16–23 |
| STM32F030 | PA0–PA7, PA9, PA10, PB1 | `16*port + bit`, port A=0 |
| STM32G030 | PA0–PA15, PB0–PB9, PC14–PC15 | Same linear port numbering |
| STM32F103 | PA0–PA15, PB0–PB15, PC13–PC15 | Same linear port numbering |
| Known STC12/STC15/STC89 declarations | P0.0–P7.7 dialect coordinates | `8*port + bit`; actual bonded pins remain a host validation responsibility |

Duplicated aliases, input writes, unmapped/reserved pins, and analog/PWM modes
refuse. Clock and pin metadata travel through readable `# @bw-*` preamble
comments. Metadata carries structure only; the reader always parses executable
statements, so editing a generated condition or output changes the imported
program. The complete old pseudocode is never replayed over edited code.

## Relation to CrispBASIC

The CrispBASIC generator, now adopted from its feature branch into `main`,
establishes a useful pattern:
ordinary host-library calls, explicit supported-pin maps, output-latch toggles,
simulated milliseconds, and named refusals rather than successful no-op stubs.
Cowgol follows those principles while keeping its different integer and string
semantics explicit. In particular, CrispBASIC's current portable-library reverse reader
refuses those calls, while Cowgol now has a qualified reverse subset.

## Qualification

`test/cowgol.test.mjs` covers conversions, edits, lexer boundaries, pin maps,
polarity, typed initializers, scope, refusal and CLI file preservation.
`test/cowgol-compiler.test.mjs` regenerates a circuit/turtle fixture, runs the
actual Cowgol frontend/backend/linker and native C compiler, executes the
program, and checks its exact host trace. A second native test verifies UTF-8,
escaped strings and byte-length boundaries through the real compiler.

```sh
node --test test/cowgol.test.mjs
COWGOL_ROOT=/path/to/cowgol node --test test/cowgol-compiler.test.mjs
```

The Cowgol workflow pins fork commit
`02318cfe4de1f5fa4bbef70446764fa8ea8b7cce`; no test depends on a moving compiler
branch. Native tests explicitly skip when `COWGOL_ROOT` is absent locally; CI
sets it and runs both. This proves the executable conversion/host contract,
not a physical hardware run.
