# CARDIAC source, input strips and original examples

The independent `src/utils/cardiacProgram.js` module assembles the documented
decimal instruction format into memory words. It does not execute a machine or
turn arbitrary Scratch, Python, JavaScript or C into CARDIAC programs. Runtime
semantics belong to the separate CARDIAC machine in `bw-board`.

## API

`assembleCardiac(source)` returns:

- `ok`: false if any error occurred; warnings alone do not reject a program.
- `words`: sorted `{address, value, line, column}` records for authored cells.
- `entry`: an explicitly selected entry or the first instruction in source
  order. Empty and data-only sources have `entry: null`.
- `listing`: the same cells with `word` (padded decimal text), original `source`
  line, `mnemonic` and `operand`. A data record has mnemonic `DAT` and a null
  operand. This describes the loaded source, never a later live-memory value.
- `symbols`: case-insensitive labels represented by uppercase keys.
- `diagnostics`: `{severity, code, line, column, message}`, with one-based source
  positions. Severity is `error` or `warning`.

An error returns `words: []`, `listing: []`, `entry: null`. A host must preserve
the edited source separately and must not replace a running image on failure.
The source is bounded to 65,536 characters and 4,096 lines. Each emitted cell
must fit the 100-cell address space. Expressions use checked integers.

`exportCardiacListing(assembly)` exports successful sparse memory with its
`ENTRY` as reparsable decimal source. Data-only source retains `DAT` so opening
it does not invent an execution entry. It does not export a live machine.

`parseCardiacDeck(text)` returns `{ok, values, diagnostics}`. This reads a
numeric input strip, not an addressed program. It accepts whitespace/comma
separation and comments, at most 10,000 values and 65,536 characters. Each value
must be an integer from -999 through 999. A rejected strip returns no partial
values. `formatCardiacDeck(values)` writes one padded decimal value per line;
`formatCardiacWord(value)` formats one memory/input word. Negative zero becomes
ordinary zero on input.

## Source grammar

The default location is **01**, leaving fixed memory cell **00 = 001** alone.
That fixed value may be stated explicitly, but no different value may be
authored at 00. A word at 99 is legal with a warning because a later `JMP`
replaces it with a return instruction.

| Syntax | Meaning |
| --- | --- |
| `INP value` | Encode opcode 0 with the address of `value`. |
| `CLA`, `ADD`, `TAC`, `SFT`, `OUT`, `STO`, `SUB`, `JMP`, `HRS` | Opcodes 1 through 9 in this order. |
| `SFT 12` | Encode the two decimal shift counts as operand 12. The runtime defines their effects. |
| `HRS` | Defaults the restart operand to 00; `HRS 10` encodes 910. |
| `ORG 20` | Change the next cell address to decimal 20. |
| `ENTRY start` | Select the initial PC without emitting a word. May refer forward. |
| `start: CLA value` | Define an instruction label. Standalone label lines also work. |
| `value: DAT -7, 42` | Emit two signed data words in consecutive cells. |
| `580`, `10: 580`, `10 580` | Raw decimal word, optionally with an explicit address. |
| `CLA table + 1` | Use a decimal/label expression joined with `+` and `-`. |
| `; comment`, `# comment`, `// comment` | Comment until the end of the line. |

Mnemonics and labels ignore case. Instruction operands and addresses must be
00–99. Data and raw memory words must be -999–999. A negative raw word is data
for default-entry selection; `ENTRY` can explicitly choose any cell. The
assembler does not certify that a chosen cell will be a valid instruction at
execution time.

Forward instruction/data references are allowed. An `ORG` may use an already
located label but cannot depend on a later location. Duplicate symbols,
overlapping cell writes, duplicate `ENTRY`, missing operands, unsupported
commands and out-of-range values are errors. No JavaScript or other executable
text is evaluated. There is no `EQU` directive or implicit binary/hexadecimal
syntax.

## Original examples

`src/utils/cardiacExamples.js` supplies the six example records consumed by the
host. The `examples/cardiac-*/program.cardiac` files contain identical canonical
sources, with an input strip, English/German introduction and expected outcome.

| Example | Input values | Expected output | Stop condition |
| --- | --- | --- | --- |
| `cardiac-echo` | 42 | 42 | Halt |
| `cardiac-add` | 17, 25 | 42 | Halt |
| `cardiac-countdown` | 3 | 3, 2, 1, 0 | Halt |
| `cardiac-night-light` | 200, 500, 800, 300 | 1, 0, 0, 1 | Wait for another input |
| `cardiac-bootstrap` | Supplied loading strip, then 35 | 42 | Halt |
| `cardiac-self-modify` | None | 11, 22, 33 | Halt |

The bootstrap exercise starts with only the fixed word at 00. Its input strip
constructs the small input loop, loads an independently authored add-seven
payload at 20–25 with data at 81, transfers execution to 20 and supplies 35.
The loader mechanism follows from the instruction rules; no manual program was
copied. The self-modifying exercise changes its `OUT` operand in RAM; its source
must not be silently rewritten to pretend it remains the executing listing.

The night-light uses numeric input/output. A circuit connection is explicitly a
modern Brickwright adapter. The adapter's sampling, voltage conversion and
electrical output are additional behavior and require their own measurements.
An expected number in this table does not establish an electrical observation.

## Authorship and verification

Authored for Brickwright from the CARDIAC instruction, memory and I/O facts in
the implementation task and the repository's existing parser/example/lesson
conventions. No third-party CARDIAC emulator or assembler source, historical
program listing, scan, or artwork was incorporated. The new parser, programs,
documentation and bilingual teaching text are original BSD-3-Clause content.

`node --test test/cardiac-program.test.mjs` checks all ten encodings, source
locations, expressions, fixed/reserved cells, atomic rejection, bounds, input
strip separation, export round trips and exact example encodings. Runtime
execution remains a separate integration check against `bw-board`.

Run `node scripts/verify-cardiac-examples.mjs --board /path/to/bw-board` to
execute all six sources on an explicitly supplied engine, plus negative,
zero and threshold-boundary cases. It verifies the actual output and terminal
state, the installed bootstrap payload and the final self-modified word. A
missing engine or failed assertion is an error, never a skipped pass. This
proves source-to-machine behavior; GUI and electrical observations remain
separate checks.
