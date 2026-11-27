# Game export (bwgame-v1)

Turns the **current SB3 graph and its assets** into an editable game that runs
outside the editor: a JavaScript web game or a Python + pygame project. Any
language the workshop reads can reach it, because everything first becomes blocks:

```
Python / JavaScript / C / BASIC / pseudocode ──► blocks (SB3) ──► game model ──► JS web game
                                   .sb3 file ──┘                            └─► Python + pygame
```

```
bw export-game snake.bw  --to web    -o snake-web      # open snake-web/play.html
bw export-game game.py   --to pygame -o game-py        # cd game-py && python main.py
bw export-game my.sb3    --to web    -o my-game.zip
```

In code: `exportGame(await loadSb3(bytes), { target: 'web' | 'pygame', title })`
from `src/game/export.js` returns `{ ok, files, report }`; `zipExport(files)`
packs them.

This implements the first slices of the G0 (semantic model + capability report),
J3 (editable JS web game) and G1 (Python + pygame source/assets) gates of
Brickwright's `docs/CODE-RUNTIME-AND-GAME-EXPORT.md`. It does not claim desktop
or mobile packaging, PWA/offline qualification, or Arcade-profile semantics.

## Pieces

| File | Role |
| --- | --- |
| `src/game/model.js` | Walks the SB3 graph: runtime manifest (stage, sprites, costumes with sizes and drawn-content bounds, sounds, variables, lists, monitors), normalized scripts/procedures, and the capability report. |
| `src/game/emit.js` | One lowering with two syntax profiles. Every script becomes a generator (`function*` / `def … yield`). |
| `src/game/runtime/bwgame.js` | JS runtime: cooperative scheduler, sprites/clones/layers, pen, input, ask/answer, monitors, sounds, seeded PRNG, deterministic clock, input-trace driver. No dependencies. |
| `src/game/runtime/bwgame-web.js` | Browser host: canvas renderer, pen layer, bubbles, monitors, ask prompt, audio, keyboard/mouse/touch, 30 fps loop. |
| `src/game/runtime/bwgame.py` | The same runtime in Python, with a pygame window host and a headless `trace` CLI. |
| `src/game/runtime/sources.generated.js` | The runtime files embedded as strings for the browser exporter. Regenerate with `node scripts/gen-game-runtime-sources.mjs`. |
| `src/game/export.js` | Packaging, manifest/report, single-file `play.html`. |

## What an export contains

**Web:** `index.html` (ES modules; serve the folder, e.g. `python -m http.server`),
`play.html` (one self-contained file with inlined runtime, code and assets; opens
from disk), `game.js`, `bwgame.js`, `bwgame-web.js`, `manifest.json`, `assets/`.

**pygame:** `main.py`, `game.py`, `bwgame.py`, `manifest.json`, `assets/`,
`requirements.txt` (`pygame>=2.5`; pygame-ce also works).

Both include `README.md` and `export-report.json`: contract versions, the
capability report, and SHA-256 of `project.json`, every packaged asset and the
runtime files. The exported source is the learner's to edit; edits do not flow
back into the project.

## Capability report

Every opcode is classified for this runtime:

- **exact**: same observable behaviour as scratch-vm for the admitted inputs;
- **approximate**: runs, with the stated difference (collision geometry, bubble
  styling, pen anti-aliasing, unrendered colour effects, sound timing);
- **unsupported**: the export is refused and each block is named (for example
  `touching color`, video sensing, music/text-to-speech extensions, hardware
  extensions). `allowUnsupported` produces the files anyway with the block left
  as a visible `UNSUPPORTED` comment.

## Semantics, and how they were checked

The scheduler follows scratch-vm: threads run in start order, hats fire for the
topmost sprite first, broadcasts start their threads in the same tick, loops
yield after each iteration, waits and glides compare elapsed **milliseconds**
(float error included), and a trailing promise block in a loop iteration
(`say/think … for … secs`, `ask and wait`, `play sound until done`) skips that
iteration's yield exactly as scratch-vm's promise handler does.

`test/game-export.test.mjs` builds 17 gallery programs (2048, Tetris, Sokoban,
Flappy, Maze, Minesweeper, Connect Four, Tic-Tac-Toe vs AI, pen art and the
motion/looks/sensing/control/operator tours) from pseudocode, runs each in the
real scratch-vm and as the exported JS game through the same key trace for 300
frames, and requires every sampled frame to agree on position, direction,
costume, visibility, variables, lists and speech bubbles. scratch-vm is pinned to
one tick per frame, its clock follows the frame counter and `pick random` draws
from the same seeded stream.

The JS and Python runtimes produce byte-identical state traces for the same
input trace (same PRNG, number formatting and float arithmetic); the parity
corpus includes the collision games (snake, breakout, invaders, pong, bomberman)
that headless scratch-vm cannot judge.

### Documented differences

- **Frame budget.** One tick per 30 fps frame. Scratch may run a compute-only
  loop several times inside its 75 % frame budget; such loops run slower here.
- **Collision** uses the rotated box around each costume's drawn content
  (derived from SVG geometry; the whole canvas for bitmaps or complex SVGs), not
  exact pixels. The same box drives `touching`, `touching edge`, edge bounce,
  click hit-testing and stage fencing.
- **Size** is not compared headless: scratch-vm ignores `set size` without a
  renderer. The runtime applies scratch-render's size limits.
- Speech bubbles, monitors and the ask prompt are drawn in a simpler style.
- Only `ghost` and `brightness` effects are rendered; others are kept as state.
- Sound effects (pitch/pan) are ignored; `play until done` waits for the sound's
  recorded duration.
- Sprite dragging is not implemented.

## Next steps

- Brickwright: vendor `src/game/*`, add "Export playable game" to the Code tab,
  and qualify the rendered journey (build → export → open → play).
- Arcade source profile (frame scheduler contract, tilemaps, overlaps).
- Pixel-mask collision as an opt-in profile where both hosts can rasterize.
- Desktop bundles (PyInstaller per OS; Tauri player for the web game), PWA.
