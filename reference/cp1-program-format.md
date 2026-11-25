# CP1 source format and independent authorship

`src/utils/cp1Program.js` is an original parser and assembler for the documented
Kosmos CP1 teaching command format. It contains no execution interpreter. The
CP1 teaching program is data for a real MCS-48 CPU and the user's monitor ROM.

## API

`parseCp1Program(source, {expansion: false})` returns `ok`, `capacity`, `bytes`,
`words`, `sourceMap`, `symbols`, `diagnostics`, `usedCells`, and `entry`. The byte
image is a `Uint8Array` of 256 bytes (128 cells), or 512 with CP3 enabled. Each
cell is opcode then operand. A diagnostic suppresses the byte image (`null`), so
loaders cannot execute a partially accepted program. Each diagnostic carries a
one-based source line and column. The map is indexed by cell address; unoccupied
cells have a null map entry. `assembleCp1Program` is a throwing convenience.

`exportCp1Program(resultOrBytes)` emits addressed decimal listings. A successful
result exports occupied cells only; a byte image exports all cells. The output
can be parsed again without changing the addresses or byte values.

## Text grammar

- Decimal cells: `04.001`, `000: 04.001`, or `000 04.001`. The dot separates two
  integer fields. It is never a floating point literal.
- Mnemonics: `AKO 42`, `ANZ`, `HLT`. Names are case insensitive.
- Labels: `again: AKO 1`, then `SPU again`.
- Location: `ORG 20`; references and cell allocation are bounded to 0–127 or
  0–255 with CP3. Overlapping writes and duplicate symbols are errors.
- Constants: `WAIT EQU 200`. Forward constants are allowed. Expressions contain
  decimal integers or symbols joined by `+` and `-`; no code is evaluated.
- Data: `DATA 42` or `DB 0, 17, 255`, one opcode-zero cell per value.
- Comments begin with `;`, `#`, or `//`.

HLT, ANZ and NEG default their unused operand to zero. Input/output selector zero
means the whole port; 1–8 means one line (1–6 on P5). CP3 instructions require
the expansion setting. This parser validates numeric encodings and addresses;
it does not attempt to predict values at runtime or replace ROM behavior.

## Sources consulted and provenance

Authored 2026-11-24 from the CP1 command/opcode, memory-cell and port facts supplied
in the implementation task, and from Brickwright-owned module, test, example and
GUI conventions. The implementation did not read or translate the asig or
lambdamikel CP1 emulators, any GPL CP1 emulator, or the prohibited local reference
directory. No third-party assembler implementation was used. The three examples
and their English/German teaching text were written for this change. The ROM is
neither bundled nor recreated here.

The factual command numbering is separated from parser mechanics and examples.
Compatibility claims depend on the hardware emulator and an appropriate ROM;
the assembler tests demonstrate encoding, validation and round-trip behavior.

## CP5-style binary workbench (2026-11-25)

`cp1-cp5-binary` is an original program and editable circuit with eight grounded
switches, explicit pull-ups, the existing Darlington driver and eight separate
current-limited LED branches. Its bilingual text, source and validation were
authored by a fresh implementation agent with no GPL source, translated
pseudocode, reference emulator internals or implementation structure exposure.
The hardware facts came from the
[original CP5 manual](https://www.retrozone.ch/docs/cp1/CP5-Ein_Ausgabe-Universalinterface.pdf),
PDF pages 2–3 and 6–7: startup output polarity, switch polarity, channel bit
order and transistor-driven LEDs. No manual program, historical ROM bytes or
scan was copied. The circuit deliberately uses the simulator's existing 5 V
Darlington model and does not claim the original hardware's load ratings.

The default CP1 tests validate assembly, source mapping, gallery reachability
and the eight separate electrical networks. The opt-in
`scripts/verify-cp1-cp5.mjs` uses the canonical engine injection and explicit
upstream source paths to solve this exact circuit with original synthetic
8049 firmware. Its current/voltage observations prove an electrical path;
they do not substitute for a separately identified historical monitor run.
Existing sibling CI pins are unchanged by this content checkpoint.

`scripts/verify-cp1-cp5-monitor.mjs` is a separate optional checker for an external
2716 monitor with the identified SHA-1. It starts the actual keypad contacts,
loads the original gallery program after startup, and checks every input bit,
the stored sample, raw display segments, driver/LED currents and paused output
behavior. The [recorded observation](cp1-cp5-observations.json) names exact clean
supplier commits and content hashes; it contains observations, no ROM bytes.
The existing Circuit UI live switch controls supply the learner's input through
the circuit board, preserving the authored numeric initial switch settings.
