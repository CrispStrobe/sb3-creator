# Breakpoint decoration: adversity analysis

Written 2026-08-09 by bw-blocks. Updated with headless Playwright testing
against the live deployment (crispstrobe.github.io/brickwright-lite/).

## How paint works

`paint(workspace)` is called on **every Blockly workspace change event** via
`workspace.addChangeListener()` in `blocks.jsx:166`. Blockly fires events for:
CREATE, DELETE, CHANGE (including collapse), MOVE, and UI (including zoom).

The dot is **re-created from scratch on every paint**: `querySelector('.bw-bp-dot')`
finds any existing dot and skips; if the SVG was rebuilt, the old dot is gone and
a new one is appended.

## Case analysis

| case | Blockly event | paint fires? | dot survives? | how |
|---|---|---|---|---|
| drag out and back | MOVE | yes | **expected yes** | SVG may be rebuilt; querySelector finds nothing; dot re-created |
| undo/redo | DELETE + CREATE (replayed) | yes | **expected yes** | block SVG rebuilt; dot re-created |
| collapse/expand | CHANGE (`collapsed`) | yes (verified: `block.js` fires `BlockChange`) | **expected yes** | collapsed blocks are in `getAllBlocks()`; dot re-created |
| project save/reload | CREATE (new blocks) | yes | **expected yes** — IF block ids survive the sb3 round-trip, which they do | marks keyed on block id; prune removes orphans; matching ids keep their marks |
| zoom | UI | yes | **expected yes** | dot is in local SVG coords (the `<g>` from `getSvgRoot()`), scales with the transform |
| block deleted | DELETE | yes | **mark pruned** | `paint()` prunes marks whose ids are not in `getAllBlocks()` (added in `76e6dfc`) |

## Headless Playwright testing (against the live deployment)

Tested with Playwright + headless Chromium against
`https://crispstrobe.github.io/brickwright-lite/`.

### Finding: the breakpoint menu does NOT appear

Loaded the "Blink two LEDs" hardware example via the pseudocode importer,
converted to blocks ("⇦ To blocks"), switched to the Code tab, and
right-clicked a `turn on led1` block.

**Result:** context menu shows only "Duplicate / Add Comment / Delete Block".
No "⏸ Pause here" item. The STC12 / 8051 pins category IS visible in the
palette, confirming this is a hardware project.

**Likely cause:** `isHardwareProject()` in `block-menu.js` checks
`vm.runtime.stc.pins.length`. The pseudocode importer sets `project.stc`
on the project, but it may not propagate to `runtime.stc` until a full
project load (via `loadProject` / `patchExtensionManager`). The blocks are
on screen, the stc12 extension is loaded (palette shows), but the runtime
property may not be set yet.

**This means no breakpoint decoration testing is possible** until the menu
gate is fixed — the decoration code is downstream of the menu, and neither
fires.

This is filed as a bug for bw-bundle (who owns the lite integration layer)
or the coordinator (who owns the debugger UI).

## What is verified

| method | cases covered |
|---|---|
| **Headless Playwright** | the menu does NOT appear — 0 of 6 cases could be tested |
| **Code review** | all 6 cases analysed (drag, undo, collapse, reload, zoom, delete) |

## What is NOT verified

- **No breakpoint decoration was actually seen in a browser.** The menu gate
  (`isHardwareProject()`) does not pass for a pseudocode-imported project,
  so the decoration path is unreachable in the tested scenario.
- **Collapsed blocks** — unknown whether the dot renders correctly.
- **Dot position on non-standard block shapes** — unknown (cosmetic).
- **The deployed build may not include the latest block-menu.js** if the
  last deploy predates the breakpoint commits.
