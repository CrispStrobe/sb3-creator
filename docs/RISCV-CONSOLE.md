# RISC-V console programs

`DEVICE RISCV32` names Brickwright's emulated RV32 console. `RISCV`, `RISC-V`
and `RV32` are declaration aliases. This machine has console output and exit
calls; it has no GPIO, display, or qualified timer interface.

```text
DEVICE RISCV32
GLOBAL total = 0
WHEN flag clicked:
  REPEAT 6:
    change total by 7
  say "RISC-V from Blocks"
  say total
```

The example emits real C and prints `RISC-V from Blocks` followed by `42` when
built and run on the console. The output targets the companion service's
`riscv32-gcc` compiler, which links RV32IMAC code against the machine's
picolibc console runtime. The browser's shecc C subset is a separate route;
this backend does not claim shecc compatibility.

## API and command line

```js
const creator = new SB3Creator();
creator.parse(source);
const result = creator.generateRiscvC();
if (!result.ok) throw new Error(result.reasons.join('; '));
// Send result.c to the C compiler using result.target === 'riscv32-gcc'.
```

The result includes `ok`, `reasons`, `diagnostics`, `warnings`, `lineMap`,
`target`, and `profile: 'int32-console'`. `c` exists only on success. The line
map identifies the originating block for emitted statement lines; it does
not promise the MCU cooperative scheduler's stepping interface.

`generateC()` dispatches to this backend when the project declares RISCV32 or
the caller passes `{device: 'riscv32'}`. A refused console program throws
`RISCV_CONSOLE_UNSUPPORTED`, with `diagnostics` attached, before any C output
is returned. An explicit `{target: 'host'}` still requests the existing host
backend. The default console dispatch also applies to the embedded
`bwTranspileC` entry point.

```sh
node bin/bw.mjs transpile example.bw --to c -o example.c
node bin/bw.mjs transpile console-only.bw --device riscv32 --to c -o example.c
```

The CLI preserves an existing output file if conversion refuses. These
commands generate C; compilation to an RV32 image remains a toolchain step.
Retargeting can add a RISCV32 declaration to a console-only project. Its empty
pin pools reject hardware programs instead of inventing circuit terminals.

## Executable subset

| Area | Supported |
| --- | --- |
| Entry | Exactly one flag script, on the Stage or one sprite |
| Variables | Signed int32 numbers, literal text, text variables |
| Arithmetic | Checked addition, subtraction, multiplication; 32-bit AND/OR/XOR |
| Conditions | Integer comparisons and short-circuit AND/OR/NOT |
| Control | Assignment, change, IF/ELSE, repeat, repeat-until, forever, stop all |
| Output | `say` and `print` as complete text/number messages with a newline |

The emitter uses the shared Cowgol checker to establish the sequential and
typed graph contract. It emits C from the accepted graph, then further
rejects any operation lacking an RV32 console implementation. Source text is
never evaluated or substituted into an executable C template.

Unsupported features include concurrent events, procedures, arrays/lists,
floating point, division/remainder, input prompts, drawing/turtle motion,
GPIO, peripheral declarations, and waits. In particular, a wait is an
explicit refusal, not a no-op or an uncalibrated busy loop. The absence of
GPIO is a property of this emulated console, not of the RISC-V architecture.

Integer values use `int32_t`. Each addition, subtraction and multiplication
computes an `int64_t` intermediate, checks the signed 32-bit range, and exits
with status 1 and an error message if it overflows. This protects loop
iterations and computed values as well as constants. It does not wrap or
depend on C signed-overflow behavior. Conditions retain short-circuit
evaluation, so an unevaluated expression cannot raise a spurious overflow.
Bit operations use unsigned 32-bit arithmetic and an explicit signed-value
conversion. `-2147483648` prints correctly.

Text uses the shared Cowgol contract, including the 127 UTF-8-byte literal
limit. Numeric-looking text remains text, and Unicode, newlines, quotes and
backslashes survive. The C emitter also escapes question marks so C99
trigraph processing cannot change an authored string.

## Cowgol route and qualification

Cowgol source can carry `# @bw-declaration "DEVICE RISCV32"`; the reader
preserves that declaration in pseudocode. Console programs in the checked
Cowgol subset can therefore read into Blocks and use the RV32 C backend.
Original Cowgol source outside the checked subset requires a compiler-service
route for that source language.

`test/riscv-console.test.mjs` checks device/alias persistence, Cowgol import,
retarget refusal, structured diagnostics and CLI file preservation. It also
compiles emitted C under C99 with warnings treated as errors and executes
it, checking actual output, short-circuit evaluation and runtime overflow
failures. `test/riscv-console-machine.test.mjs` takes current generated C
through the local service's real RV32 compiler and executes the resulting
images on the exact Brickwright emulator. It verifies both the successful
console output and the overflow exit status.

Both suites run in the Cowgol integration workflow. The machine test pins
`stc-compiler` at `f73c443843bbe6ecd524b428d4edcf4e24703c1a` and `bw-board` at
`d21d6d8b819263eb08231134b7556efa82289a90`; it sends no source to a remote
compiler endpoint. Locally it skips explicitly unless
`COWGOL_STC_COMPILER` and `COWGOL_BW_BOARD` name those checkouts. This validates
the software console route and does not claim a physical-board run.
