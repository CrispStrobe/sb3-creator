# State of the LED cube — four implementations, one table

Written 2026-08-09 by bw-blocks, because the four pieces were built by three agents and
nobody had mapped which consumes which.

## The four implementations

| where | kind name | what it does | consumes | consumed by |
|---|---|---|---|---|
| **sb3-creator** `sb3Creator.js` | `ledcube_*` (10 opcodes) | Parse/decompile/round-trip. `generateC()` emits the scan kernel + frame buffer. `RUNTIME_EXTENSIONS` entry drives Python/JS codegen via `ledcubeSimulatorDriver`. | `project.stc.ledcube` declaration | The block editor (via pseudocode importer), and `generateC/Python/JavaScript`. |
| **extensions** `CrispStrobe/ledcube.js` | `ledcube` (VM ext id) | Scratch VM extension: 10 blocks in the palette, frame buffer on `runtime._ledcubeFrame`. | `runtime.stc.ledcube` (cube dimensions) | The block editor (live execution when ⚑ is clicked). |
| **bw-circuit-ui** `model/ledcube.js` + `model/circuit.js` | `ledcube` (palette kind) | Renders the cube in the circuit designer. Duty-cycle integrator over scan history → brightness per voxel. `VOXEL_MAP` (all null — unmeasured). `BW_CUBE_ACTIVE_HIGH = true`. | Scan history from the board (P2 select events + P0 data) | `CircuitDesigner.jsx`, `BoardCanvas.jsx`. |
| **bw-board** `board.js` | `led_cube` (underscore) | Engine-level part: validates terminals, maintains scan history. | Netlist from `_syncNetlist` | — currently **unreachable**: `bw-circuit-ui` strips `ledcube` from `_syncNetlist` before it reaches the engine. |

## The disconnect

`bw-circuit-ui` uses kind `'ledcube'` (no underscore); `bw-board` uses `'led_cube'` (with
underscore). The UI's `_syncNetlist` strips `ledcube` as a UI-only kind (alongside `meter`),
so bw-board's `led_cube` engine path is never exercised from the circuit designer.

This appears to be **by design**: the circuit designer renders the cube from its own model
(`model/ledcube.js`), consuming scan history (P2/P0 events) directly from the board rather
than through a `led_cube` engine part. The engine kind exists but has no current consumer
through the UI path.

## Two unverified assumptions (both named and single-sourced)

1. **P0 polarity** — `BW_CUBE_ACTIVE_HIGH`: measured by emu8051-stc Finding #14 (3,930+
   writes, zero exceptions). Not yet confirmed on silicon. One constant in each of the four
   implementations; changing it flips every frame operation.

2. **Voxel map** — `bw_cube_addr()` / `VOXEL_MAP`: identity placeholder
   (`select = z*2, bit = y*N + x`). All 64 entries are null in `model/ledcube.js`. Only
   `probe.c` on a real cube can fill it. Changing the table in any one place corrects that
   implementation; the four tables are not yet unified into one shared source.

## What is NOT verified

- The ledcube VM extension has **not been tested in the running editor** — only through the
  conformance test (opcode agreement, argument shapes, menu identity).
- The `hold` block maps to `scratch.wait(ms/1000)` in the neutral shim, which is the right
  shape but has not been tested with sub-millisecond values. A `hold 0.4 ms` would wait
  0.0004 seconds, which may round to zero in some runtimes.
- The `readvoxel` reporter returns `0` when there is no cube. This is indistinguishable from
  "that voxel is dark" — the same issue the circuit reporters had before the NaN stopgap.
  Not yet fixed for ledcube.
