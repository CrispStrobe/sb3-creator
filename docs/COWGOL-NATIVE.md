# Checked Blocks to native Cowgol

`SB3Creator.generateCowgol(project, {target})` lowers a Blocks project to Cowgol
for a qualified native runtime. This is separate from the default reversible
`host-int32` export used by the editable Cowgol tab. It can also be called after
parsing pseudocode or successfully importing supported Cowgol source to Blocks.

```js
const creator = new SB3Creator();
creator.parse('WHEN flag clicked:\n  say 42\n');
const result = creator.generateCowgol(undefined, {target: 'dos'});
if (!result.ok) throw new Error(result.reasons.join('; '));
// Submit result.cowgol to the matching Cowgol compiler-service target.
```

Success returns `cowgol`, `preview`, `warnings`, `diagnostics`, `reasons`,
`lineMap`, `stats`, `target`, and `profile: 'native-int32'`. Failure has
`ok: false` and **no `cowgol` field**. A preview is diagnostic material, not an
executable fallback. An unknown target or conflicting explicit `profile`
refuses. The options do not mutate the input project or retarget its pins.

## CLI and embedded hosts

The producer CLI exposes the same checked profiles explicitly:

```sh
node bin/bw.mjs transpile example.bw --to cowgol --target dos -o example.cow
node bin/bw.mjs transpile blink.bw --to cowgol --target atmega328p -o blink.cow
```

Omitting `--target` preserves the reversible host export. `--target` selects a
native generator contract; it never implicitly changes the authored device.
Use the separate `--device arduino-uno` option to request retargeting first.
Cowgol export also accepts an authored `.sb3` archive and validates its original
block graph. It does not decompile and reparse the project, which could discard
unsupported extension blocks. `.sb3` export refuses `--device`; explicit
retargeting remains an authored-source operation.
An unknown target, incompatible declaration or unsupported operation exits
unsuccessfully before writing the destination. `--target` on other commands
or output languages refuses instead of being ignored. Native source still
requires the matching compiler service to produce an executable.
Native text export also refuses parser warnings, including before retargeting:
a parser recovery that turns an expression into literal text must not become
a successful executable conversion.

The self-contained JavaScript bundle provides the same operation to QuickJS,
boa or other hosts without Node or DOM globals:

```js
const profiles = bwCowgolTargets();
const result = bwTranspileCowgol(source, undefined, {target: 'atmega328p'});
// Explicit retarget followed by checked generation:
const retargeted = bwTranspileCowgol(source, 'arduino-uno', {target: 'atmega328p'});
```

The existing two-argument call keeps its host-profile behavior. Refusal throws
before returning source. The options object accepts only `target` and `profile`;
an explicit profile must agree with the selected target. `bwCowgolTargets()`
and the module export `cowgolTargets()` return fresh JSON-friendly metadata:
the exact target, label, accepted devices, canonical clock where required, and
console, digital, pull-up, delay and canvas capabilities. This describes the
generator's qualified subset; it does not report installed compilers, connected
hardware or a hardware execution guarantee.

## Qualified targets

| Target | Accepted DEVICE declarations | Native surface |
| --- | --- | --- |
| `z80-cpm` | `Z80` | Text/number console, sequential integer/text state and control |
| `i8080-cpm` | `Z80` | Same console subset, compiled for the 8080-compatible CP/M target |
| `dos` | `I8086` and its ordinary parser aliases | Same console subset, DOS MZ executable |
| `riscv32` | `RISCV32` and its ordinary parser aliases | Same console subset, RV32 ELF |
| `eater6502` | `EATER6502`, 1 MHz | Console plus VIA digital PA0–PA7 and PB0–PB7 |
| `atmega328p` | `ATMEGA328P` or `ARDUINO-UNO`, 16 MHz | Serial console, digital D2–D13 and A0–A5, literal millisecond waits |

A declaration-free console program can use any target. An explicit incompatible
device refuses; the caller must obtain an intentional retargeted project before
generation. GPIO declarations refuse on the console-only targets even when the
script does not access them. Port/peripheral declarations, lookup tables,
custom memory maps, and multiple boards refuse. Eater and AVR clocks must match
their canonical runtime. This API qualifies generated source, not physical
board execution or deployment of a compiler service.

Eater's native runtime owns the VIA timer, so PB7 is available here. The default
reversible export still reserves PB7 for the older downstream C/BASIC route.
Eater digital input has no internal pull-up binding: an `INPUT ACTIVE LOW`
declaration, which requests that mode in the shared contract, refuses. Active-low
outputs are supported. AVR supports floating input, output and input with pull-up;
D0/D1 remain reserved for USART0. Both runtimes toggle their output latch instead
of the measured electrical input. AVR Nano is not an alias for this profile.

AVR literal waits call the native blocking `bw_delay` binding. Durations must
be nonnegative literals within signed int32 milliseconds; as with ordinary
Cowgol export, seconds are rounded to the nearest millisecond. Zero is a no-op.
The fixed 16 MHz runtime waits at least 16000 CPU cycles per millisecond;
function and loop overhead add a small delay. This single-script operation
provides no concurrent scheduler, wall-clock reporter or interrupt timebase.
Other native targets continue to refuse waits.

Canvas/turtle operations, clocks as reporters, concurrent events,
procedures, lists/arrays, user division/remainder and floating point retain named
refusals. Other native Cowgol source can use a larger language/runtime subset via
the separate original-source compiler route; it is not implied by this generator.

## Integer execution and lazy conditions

Native-profile generation checks every generated addition, subtraction,
multiplication and variable increment before performing the arithmetic. An
out-of-range intermediate prints `Cowgol Blocks: signed int32 overflow` and
calls `ExitWithError()`. The program cannot wrap an intermediate and continue
with a misleading Blocks result. Bitwise operations preserve the signed 32-bit
bit pattern; loop counters decrement only while positive.

The helper routines use only 32-bit types so that they work on the 8-bit native
targets. Multiplication compares bounds using guarded signed division, never
divides by zero or computes `INT32_MIN / -1`, and performs the multiplication
only after the check. Signed limit literals are explicitly typed: an untyped
`-2147483648` can otherwise select an unsigned division in Cowgol.

Boolean AND, OR and NOT lower to explicit nested control flow. Cowgol evaluates
calls in a compound condition before branching, so a direct `and`/`or` expression
would eagerly evaluate an overflow-check helper or GPIO read. The native emitter
evaluates the right operand only when needed. Repeat-until conditions are
re-evaluated on every iteration with the same lazy behavior.

The emitted helpers contain constructs outside the smaller reverse reader
(typed casts, division and value-returning procedures). Native output is an
execution artifact; the default `generateCowgol()` output remains the source
for qualified Cowgol ↔ pseudocode round trips and keeps its existing arithmetic
range warning.

## Verification

`test/cowgol-native.test.mjs` checks all target/device contracts, unsupported
surface refusal, Eater PB7, AVR reserved pins/pull-ups, and source line mappings.
`test/cowgol-native-compiler.test.mjs` compiles the generated source with the
actual pinned Cowgol compiler and executes it. It checks the signed limits,
all operand-sign combinations, overflowing intermediates, nested calls,
short-circuit conditions, loop re-evaluation and GPIO/polarity callback traces.
These host executions qualify generator/language behavior; native machine
execution is additionally exercised by `test/cowgol-native-machine.test.mjs`.
That suite compiles actual Z80 CP/M, 8080-compatible CP/M, DOS, Eater, RISC-V and
ATmega328P images through the pinned service and runs them on cpmemu, emu2,
Brickwright's exact 6502 and RV32 machines, and avr8js 0.21.1. It reuses the host
suite's mathematical boundary oracle and all
overflow cases, checks lazy conditions and loops, and requires no ROM writes
plus restoration after reset for the Eater GPIO program. CP/M's runtime returns
to the OS without a portable error status, so its overflow contract is the
diagnostic followed by an immediate stop; DOS, Eater, RV32 and AVR also return status 1.
The RV32 tests boot the service's actual returned ELF image, independently of
the older checked RISC-V C generator. AVR executes the actual returned HEX,
checks generated arithmetic and refusal paths, verifies active-low GPIO and
pull-ups, and cold-boots twice from nonzero SRAM. Its GPIO trace measures the
generated 0, 1 and 7 ms pulse intervals at the real emulated CPU cycle count;
every execution must keep flash intact and remain within the reserved stack.
`test/cowgol-surfaces.test.mjs` builds the embedded bundle, checks native source
equivalence in a bare VM, and exercises CLI refusal without overwriting files.

```sh
node --test test/cowgol-native.test.mjs
COWGOL_ROOT=/path/to/cowgol node --test test/cowgol-native-compiler.test.mjs
```

For the native machine suite, set `COWGOL_STC_COMPILER`, `COWGOL_BUNDLE`,
`COWGOL_CPMEMU`, `COWGOL_EMU2`, `COWGOL_BW_BOARD`, `COWGOL_AVR_RUNNER`, and `AVR8JS_ROOT`
to the local service, built bundle, execution-oracle binaries, pinned board
checkout, Cowgol's `tests/avr-run.mjs`, and avr8js package directory. The workflow
builds these from exact commits and sets `REQUIRE_COWGOL_NATIVE_MACHINES=1`,
which makes missing tools fail the tests instead of skipping them. The native
suite installs nothing and never sends source to a deployed service.
`COWGOL_RISCV_GCC_STAGE` can select a writable staging directory for the bundled
RV32 GCC/picolibc tools; otherwise the service uses its normal staging path.
`COWGOL_AVR_STAGE` similarly selects a writable AVR staging directory.
When an AVR GCC/avr-libc prefix is already expanded, `COWGOL_AVR_GCC_ROOT`
reuses it directly for this test suite, avoiding a second toolchain copy.

The existing `test/cowgol.test.mjs`, `test/cowgol-compiler.test.mjs` and
RISC-V console tests remain regression gates for the ordinary conversion and
the independent checked RISC-V C backend.
