# The debugger surface — boundary D, as something a Scratch user can operate

Design note, 2026-08-09. [`stc12c5a60s2-lab/docs/DEBUG-CONTROL-MODEL.md`](https://github.com/CrispStrobe/stc12c5a60s2-lab)
fixes boundary D: what `halt`, `step`, `breakpoint` and `position` *mean*, and how the three
targets (an emu8051 fork, a ucsim fork, an on-chip monitor) differ. It deliberately says
nothing about UI. This file is the other half — **how that contract becomes a front end**, and
what has to exist in this repo for it to work.

It sits beside [`simulation-contract.md`](simulation-contract.md) (boundaries A/B/C) and
[`simulation.md`](simulation.md) (the board layer) because the debugger is the fourth boundary
over the same stack, not a separate product.

## State of play — read this first, the older plan docs are behind

The emulator's debug surface is **already built and completely unwired.** The vendored
`emu8051.wasm` in `brickwright-lite` exports the whole of boundary D:

```
emu_dbg_halt   _run   _step   _tick   _run_until_ns   _reset
emu_dbg_set_bp_code   _set_bp_yield   _clear_bp   _set_on_halt
emu_dbg_read_mem   _write_mem   _pc _acc _b _psw _sp _dptr _rn
emu_dbg_set_task   _task_state   _task_until   _bw_ms   _set_bw_ms_addr
emu_disasm
```

`bw-board/emu8051-adapter.js` exposes **none** of them — it implements boundary A only (pins,
ADC, time). So the chain is:

| link | where | state |
|---|---|---|
| emulator debug core | `emu8051.wasm` | **done** |
| JS `DebugTarget` over it | `bw-board/src/emu8051-debug.js` | **done 2026-08-09** |
| `(task, state) → block id` | **this repo, `generateC`** | **done 2026-08-09** |
| symbol table with addresses | `stc-compiler/stc_symtab.py` | done, block ids merged |
| run-loop owner | `bw-board/src/debug-session.js` | **done 2026-08-09** |
| a symbol table a BROWSER can get | `stc-compiler` `POST /compile {"symbols": true}` | **done 2026-08-09** |
| host: build → compile → load → glow | `brickwright-lite` `lib/bw-debug/debug-runner.js` | **done 2026-08-09** |
| controls | `brickwright-lite` `tw-pseudocode/debug-panel.jsx` | **done 2026-08-09** |
| breakpoint-on-block | `brickwright-lite` `lib/bw-debug/{breakpoints,block-menu}.js` | **done 2026-08-09** |
| the "under the hood" drawer, at TUI parity | `brickwright-lite` `tw-pseudocode/debug-drawer.jsx` | **done 2026-08-09** (§4b) |
| the inspector: variables, pins, timeline | `brickwright-lite` `tw-pseudocode/debug-inspector.jsx` | **done 2026-08-09** (§4a) |
| a target picker, the skew badge | `brickwright-lite` | missing — both need a live target |

**The symbol table needed an endpoint.** A browser cannot run SDCC and cannot run
`stc_symtab.py`, and the yield map alone is not enough: it says which *block* each
`(task, state)` is, but not where `<task>_state` lives in RAM or what code address a yield
sits at — only the linker knows that. So `POST /compile {"symbols": true}` returns the image
and the table together, and the runner joins the two halves on `(task, state)`, the one key
that survives the whole chain.

The third row is what decides whether this becomes a debugger a child can use or a register
dump. Everything visual depends on it, and only this repo can produce it — the emitter is the
only thing that knows which Scratch block a `case` label came from.

**The chain is verified end to end**, with nothing stubbed:
`bw-board/bench/e2e-debugger.mjs` runs blocks → `generateC({debug: true})` → `sdcc --debug` →
`stc_symtab.py` → the emulator, sets a `yield` breakpoint on the second task's `REPEAT` head,
and lands on `control_repeat` — the block a UI would glow — at `bw_task1` state 1, PC 0x170,
82 µs of program time, skew 0. It lives in `bench/` rather than `test/` because it needs two
sibling checkouts, a real SDCC and a built WASM; as a test it would skip on most machines, and
a suite reporting "0 fail" while running nothing is worse than no suite.

## The rule the whole design falls out of

> **The default UI is the *intersection* of boundary D's capability matrix. The advanced drawer
> is the *union*, with a stated reason on everything greyed out.**

DEBUG-CONTROL-MODEL §1 says the three targets are unequal, that the differences are forced by
the silicon, and that a front end hiding them "produces a front end that lies to the user the
moment it is pointed at real hardware." Read as a UX rule that hands you the design for free,
because the intersection of emu8051 / ucsim / on-chip monitor is:

**halt · resume · `step('block')` · `yield` breakpoints · read memory**

— which is exactly the vocabulary a Scratch user already has. That is not luck. Level 1
position was designed to be the cheap thing that works everywhere, and the cheap thing that
works everywhere turns out to be the one that matches the block editor. Build the entire
default surface out of it and the same UI is truthful against a simulation and against silicon.

## 1. The debugger is not a tab. It is the green flag.

Do not ship an emu8051-TUI-shaped pane as a sixth tab. Its panes are right for an engineer and
wrong as the default for someone who arrived here from Scratch.

Extend the controls the user already knows, in the stage header beside ⚑ and ⏹:

```
 ⚑    ⏸    ⏭      ⏹        [ ▾ Simulated board ]
run  pause step   stop      target
```

- ⏸ → `halt()`, ▶ → `run()`, ⏭ → `step('block')`, ⏹ → `reset()` + detach.
- **`block` is the only step verb in the default UI.** It is the one kind every target supports
  natively, and "run to the next yield" is what a Scratch user means by "next block" anyway.
  `insn` / `line` / `over` / `out` live in the drawer (§4) and grey out per `capabilities()`.
- The target picker is the single new global control: `Simulated (emu8051)` / `Live board (USB)`
  / `Quick run (JS)`. Everything else in the UI reacts to `capabilities()`; nothing assumes.

## 2. Position is the glow. This is the whole feature.

Scratch already owns the visual vocabulary for "where the program is": the glowing script
outline, which the user has been trained on since their first project. `vm.runtime.glowBlock` /
`glowScript` exist and are already driven for the VM's own threads.

Level 1 gives `(task, state)` for three RAM reads — no instrumentation, on every target. Map it
to a block id, glow that block, and **a halted 8051 looks exactly like a paused Scratch
script.** Nothing else buys as much intuition per line of code.

### 2.1 The missing link, and where it belongs

`stc_symtab.py` already produces `yields: [{state, label, addr}]`, but its `label` is explicitly
*"advisory only — nothing consumes this semantically"*: `"wait"`, `"loop_top"`, `"repeat_top"`.
There is no path from a yield back to a block, and neither emulator can invent one — by
agreement both take a symbol table as input.

So `generateC` states it, exactly as it already states the device, the pin table, the
pre-mangling variable names and the script boundaries. **The `@bw` marker header grows a yield
map** (§7 is the normative spec):

```
 * @bw yield bw_task0 0 j%3Ap%5EE%2AhF%2CqR%25nT.b%7C hat
 * @bw yield bw_task0 1 %28X%40w-2%23yQ%2Fs%3B%5D%7BvK%21 forever
 * @bw yield bw_task0 2 R%5E%2Cm%3F9pA%2A%7Cz%2BsD%23e%29t wait
```

`stc_symtab.py` reads the same header it already scans for `case` labels and carries `block`
into `yields[]`, so the on-chip monitor and both emulators consume one file — as they already
do for everything else.

### 2.2 Two honesty constraints on the glow

**Granularity.** Yield-to-yield means a run of straight-line statements does not move
`<task>_state`. Render the glow as a **region** — outline the run of blocks from this yield to
the next, with the yield block itself solid — rather than a single-block highlight implying a
precision we do not have. Level 2 (`BW_TRACE(<block-id>)` per block, DEBUG-CONTROL-MODEL §2)
upgrades this later without changing the UI, which is the right time to spend flash on it.

**Identity.** `bw_taskN` ↔ script is positional today. A user reordering hats would silently
repoint every breakpoint. The yield map fixes this by carrying block ids, which are stable
across a reorder; the UI must key on the block id and never on the task index.

## 3. Breakpoints are a right-click on a block

Right-click → **"Pause here"**, rendered as a red dot on the block, as every editor does. That
is `setBreakpoint({kind: 'yield', task, state})` — the one breakpoint kind all three targets
support.

If the clicked block is not itself a yield point, **do not refuse.** The user cannot see which
blocks are yield points, and refusing a click on a block that looks identical to its neighbour
is the fastest way to make this feel broken.

**As built (2026-08-09), every block can be marked and the mark is kept**, whether or not this
build has a yield point for it. The runner resolves what it can and reports the rest as
`unreachableBreakpoints`, which the panel lists as *"cannot be stopped at"* with the reason. That
is a shift from the "snap forward to the next yield" this section originally specified, and the
reason is worth recording: snapping means the program stops somewhere the user did not click,
which is a *silent* relocation of their intent. Listing the mark as unreachable keeps the intent
where they put it and explains the limitation once, in a place they can read at leisure — and an
edit that adds a `wait` above the block makes it live without them doing anything. Revisit if
users report the list is easy to miss; snapping remains the alternative.

**Breakpoints live outside the runner**, in `lib/bw-debug/breakpoints.js`, because the two have
different lifetimes and the user's is longer: you mark a block before pressing ⚑, when no
emulator and no symbol table exist. A store owned by the runner would lose everything on the
first stop. Verified end to end — `npm run smoke:debugger` marks a block before anything is
built, and the first run halts there.

Watchpoints (`write` / `read`) are emulator-only. Offer them from a variable's own right-click
menu, and on a live target grey them out with the reason: *"a real chip can only check between
blocks — that would be sampling, not a watch."*

## 4. Layout

The tabs stay as they are. The debugger inhabits them rather than adding a sixth.

```
┌───────────── Blocks tab ─────────────┐  ┌──── stage / circuit ────┐
│                                       │  │  ⚑ ⏸ ⏭ ⏹   [target ▾] │
│   [ when ⚑ clicked ]  ← glowing       │  ├─────────────────────────┤
│   ● [ turn on led1 ]  ← breakpoint    │  │  Circuit tab: the board │
│     [ wait 1 second ]                 │  │  LED lit, pot turnable, │
│     [ turn off led1 ]                 │  │  buzzer audible         │
│                                       │  ├─────────────────────────┤
│                                       │  │ ▸ Under the hood        │ ← closed
└───────────────────────────────────────┘  └─────────────────────────┘
```

"Under the hood" is a drawer, **closed by default**, and it is where emu8051's TUI gets to be
itself. Opening it is the user declaring they want the engineer's view. §4b is the parity map.

The Circuit tab needs no new interface at all — DEBUG-CONTROL-MODEL §3.1 settled that. A halted
MCU stops calling `advanceTo`, so the board freezes coherently, and `CircuitDesigner` already
accepts `debugState: {halted, skewNs}`. Two rules it must actually implement: **no wall-clock
catch-up on resume**, and `setControl` stays live while halted (turning the pot is intent, not
physics).

## 4a. What a debugger for THIS audience leads with

Parity with the TUI (§4b) is the floor, not the design. The TUI's first pane is a disassembly
and its second is `A R0..R7 B DPTR`; that is correct for someone who knows the 8051 and wrong
as the first thing shown to someone who has just written `change counter by 1`. Every mature
debugger — DevTools, VS Code — puts the user's own nouns first and the machine's underneath.
This one could not, until the symbol table learned which memory holds `counter`.

Built 2026-08-09 as `components/tw-pseudocode/debug-inspector.jsx`, above the drawer:

1. **Their nouns, not the machine's.** Variables under the name the user typed, from
   `symbols.variables` — `generateC` states the `@bw var <c> "<original>"` pair because `cName`
   mangling is not reversible, and `stc_symtab` joins it to the linker's address. Pins as
   physical facts: `led1 is on`, `pot is at 2.47 V`, with the **active-low inversion already
   applied**, because printing "P1.0 = 0" teaches the exact opposite of what this board exists
   to teach. A variable the linker dropped is reported as unlocated rather than omitted — a
   front end that silently leaves it out has the user hunting for a variable that appears to
   have vanished.

2. **Change, not just state.** A value that moved since the last stop is highlighted with its
   previous value beside it. Seeing *what changed* is most of debugging; a wall of identical
   numbers is not.

3. **Time travel.** The trace already captures a full snapshot at every stop, so the timeline
   only needed an axis. Scrub back and the variables pane shows what they were *then*, compared
   against the stop before — so "what changed" means the same thing live and in the past.

   It is **explicitly read-only and says so**: the program is not being rewound, you are looking
   at what was recorded. Claiming otherwise would be the same class of lie as a multimeter
   reading ohms on a live circuit. Pins are therefore live-only and disappear while scrubbing —
   they come from the board, which keeps no history, and showing a live pin beside a past
   variable is the more confusing option.

The layering is the point: **what happened → why → under the hood**, each one openable only if
the last was not enough. The drawer is closed by default and the inspector is not.

### 4a.1 Conditional pause points, and the thing they exposed

"Pause here **when `counter > 10`**" — the one feature that turns a breakpoint in a loop from
useless into the whole point. Added 2026-08-09; it needs no emulator change, because a
condition is evaluated on the host when a hit arrives and a false one simply resumes.

**The condition is parsed, never `eval`ed.** The obvious implementation is
`new Function('return ' + expr)`, which would run arbitrary code from a project file with full
page access — in an editor whose purpose is that children open each other's projects. The
grammar is instead small enough to read in one sitting: a comparison between a variable and a
number, joined with `and` / `or`. `=` means equals, because that is what a Scratch user writes.
No arithmetic, no calls. An expression it cannot parse is **rejected with the reason at the
point it was typed** — never treated as true (pause always) or false (pause never, and look
broken). A name the current build has no variable for is accepted but flagged, since the
commonest condition that never fires is a misspelt one.

**What it exposed is more interesting than the feature.** A yield breakpoint is a code address
at a `case` label, and the cooperative scheduler re-enters that label on *every pass of the
dispatch loop* while the task sits in it. So a pause point on `wait 0.3 seconds` fires
**thousands of times during that one wait** — measured at 1,749 hits before the fix. Unconditionally
that means "resume" appears to do nothing; conditionally it means the condition never gets the
chance to become true, because each visit costs a frame and program time advances by
microseconds.

Two fixes, both of which the design already implied:

1. **One stop per visit.** The task itself knows the difference — while it is waiting,
   `<task>_until` is in the future — so the halt handler reuses the generated C's own
   wraparound-safe 16-bit compare and passes over hits taken mid-wait. The stop lands on the
   pass where the wait is over, which is also the moment the user means by "pause here".
2. **Absorb passed-over hits inside one frame**, bounded, rather than one per frame. With the
   fix a `counter > 2` pause point stops at exactly `counter == 3`, having passed over 118,157
   hits — a number that is itself the argument for both fixes.

### 4a.2 Hover a block: what was `counter` *here*?

Added 2026-08-09. Hovering any block that is a yield point shows the variables as they were the
last time the program was at that block, and **always says when** — `last here 340 ms ago`, or
`here now` when it is stopped there.

This answers the question a learner actually has, and the one a live-values pane structurally
cannot: by the time you look at the panel, the program has moved on. It needed no new
recording — every stop already carries a variable snapshot and the position it was taken at, so
this is a lookup over the trace.

Two small honesty rules. **A block that has never been stopped at shows nothing**, rather than a
tooltip full of zeroes or of current values; "no recording here" is a real answer and different
from "everything was zero". And the timestamp is never omitted — a value with no time beside it
reads as current, which is the one thing it is not.

The plumbing is worth recording because it is the smallest thing that worked: the workspace is
mounted by `containers/blocks.jsx` and the runner by the Circuit tab's panel, and neither is the
other's parent. Threading a runner through the GUI to reach one tooltip would couple most of the
editor to the debugger. Instead the runner publishes a lookup into `lib/bw-debug/hover-values.js`
and the editor asks; an editor with no debugger attached gets `null` and shows nothing.

## 4b. Parity with emu8051's TUI — the map

Built 2026-08-09 as `components/tw-pseudocode/debug-drawer.jsx`. The TUI is the reference, so
"parity" has to mean something checkable: every pane and every key it has, enumerated from
`mainview.c` / `memeditor.c` / `logicboard.c` / `options.c` / `popups.c`, against what the
drawer does.

| emu8051 TUI | here | note |
|---|---|---|
| code pane — PC, opcodes, assembly, per executed instruction | trace table, first three columns | |
| register pane — A, R0–R7, B, DPTR per instruction | trace, `registers` column group | |
| PSW pane — 8 bits per instruction | trace `PSW` column; named flags in *Registers* | |
| I/O pane — SP, P0–P3, IP, IE | trace `ports` column group; *Registers* | |
| timer pane — TMOD, TCON, TH0, TL0, TH1, TL1, SCON, PCON | trace `timers` column group; *SFRs* | |
| code pane (the TUI has none — its code box is the trace) | *Code at the program counter* | anchored at the PC and read FORWARDS: an 8051 cannot be disassembled backwards, because nothing marks where an instruction starts |
| memory window, cycling Low/Upr/SFR/Ext/ROM | *Memory*, a space picker over all five | click a byte to edit |
| stack pane | *Stack*, 0x08..SP, top marked | |
| misc pane — cycles, time, clock | *Clock* | cycles **derived** from ns × f, and said so |
| memory editor view (F3) | the same *Memory* pane | one editor, not two |
| logic board view (F2) | **the Circuit tab** | a second, worse board would be the wrong parity |
| options view (F4) | project `CLOCK` declaration | the clock is the project's, not a setting |
| `space` single step | *Step instruction* (and ×10) | |
| `r` run / stop, `+`/`-` speed | ⚑ ⏸ ⏹ and the speed dial | |
| `k` breakpoint at an address | **click a line in *Code*** | plus breakpoint-on-block, which the TUI has no notion of. Clicking the line it is on beats typing the address it is at, and removed a `window.prompt` |
| `g` go to address | *Set PC* | |
| `home` / `z` reset, `Z` wipe | *Reset* / *Wipe* | |
| `l` load intel hex | ⚑ builds and loads from the blocks | loading a foreign image is not this tool's job |
| cursor + hex editing of any value | click a byte in *Memory*, or a register in *Registers* | every register IS a location — A is SFR 0xE0, R3 is IRAM bank×8+3 — so both go through the same `writeMem` |
| `end` reset the tick counter | — | time is program time since reset; ⏹ is the reset |

**Three places it is deliberately not a copy**, each because the terminal was the constraint:

1. **Five panes are one table.** They already are in the TUI — `mainview.c` keeps one history
   ring and draws five columns of it, scrolled together. Eight boxes across 80 columns is a
   layout constraint, not a design. One row per instruction, with registers / ports / timers as
   toggleable column groups, is the same data with the relationship made visible.
2. **Nothing is a bare number where a name exists.** PSW is eight named, hoverable flags rather
   than eight digits under a `C-ACF0R1R0Ov--P` header; SFRs are `TMOD`, not `0x89`; the active
   register bank is stated rather than left to be decoded out of PSW.4:3. The TUI's users know
   the 8051 already. This one's are learning it.
3. **The trace says what it did not record.** A row is about thirty WASM calls, so a
   full-speed run cannot be traced per instruction — and neither can the TUI's, which records
   per instruction only because its loop single-steps. Stepping here traces instruction by
   instruction; a free run records where it stopped, and the pane says which it is showing.

Two supporting pieces were needed. **Opcode lengths** (`lib/bw-debug/opcodes.js`) are generated
from `stc_disasm.py`'s table rather than obtained from the emulator: `emu_disasm` returns the
mnemonic but not the length, and the trace's opcode-bytes column needs it. Generating it avoids
rebuilding and re-pinning the WASM for a fact already written down in the one place with an
oracle behind it — and `npm run smoke:debugger` checks the copy against that source on a real
image (**237 instructions, 0 disagreements**). **`emu_disasm` itself** returns a `const char *`,
normally unreachable (§7b); `ccall` with a `'string'` return marshals it using Emscripten's own
heap access, which *is* exported.

## 5. Three honesty affordances

1. **`skewNs` gets a visible badge.** Built 2026-08-09 in `bw-circuit-ui`, where the prop had
   been *documented and ignored* — `CircuitDesigner`'s JSDoc described `debugState` and the
   component never destructured it, so the status line said "LIVE — emulator driving pins" for a
   board whose program had been stopped for four seconds. Now: running → `LIVE`; halted with
   `skew == 0` → `PAUSED — program and board are frozen together`; halted with `skew > 0` →
   `SNAPSHOT — the board kept running for 4.2 s while the program was stopped`, **with the
   number**, because "stale" alone is not actionable. A snapshot is also desaturated: it must not
   *look* like a live board. A frozen simulation gets no treatment, because nothing about it is
   stale — rendering both the same is exactly the information `skewNs` exists to carry being
   thrown away. Controls stay live in both, since turning a pot with the program stopped is
   intent rather than physics. Not observable in this fork yet (an emulator always reports 0),
   but the path is complete rather than promised.
2. **Greyed controls carry their reason in the tooltip, always.** "Step one instruction — not on
   a live chip through this monitor (it needs P3.2)." A dead button that explains itself teaches
   the hardware; a dead button that does not reads as a bug.
3. **`consumes` is a banner, not a footnote.** *"Debugging over USB uses Timer 1 — your buzzer
   will be silent while attached."* That is the case that forced `consumes` into the interface,
   and without UI it is invisible: the only symptom is a buzzer that does not sound.

## 6. One owner of time

Today the Code tab's Run does a batch and the Circuit tab runs its own scripted loop. With a
debugger there must be **exactly one owner of the run loop**, or ⏸ means two different things
depending on which tab is open.

Drive it from `requestAnimationFrame` in bounded chunks — roughly 16 ms of program time per
frame via `emu_dbg_run_until_ns` — checking for halt between chunks. Halt latency of one frame
is imperceptible and the main thread stays alive. **Do not call a long `advance_to_ns` and
hope:** that freezes the tab and makes ⏸ a lie.

A Worker is the v2 answer, and it has to take the board with it — push-mode pin callbacks cross
that boundary per edge, so splitting emulator from board across a postMessage would be far
worse than either arrangement. v1 keeps both on the main thread.

## 7. The marker format — normative

Implemented 2026-08-09. `generateC(project, {debug: true})` emits one `yield` line per state,
per task, in the `@bw` header, ordered by task then state:

```
@bw yield <task> <state> <block> <kind>
```

| field | meaning |
|---|---|
| `task` | the C function name, `bw_taskN` |
| `state` | the `<task>_state` value, matching a `case N:` label in that function |
| `block` | the Scratch block id, **percent-encoded** (see below) |
| `kind` | `hat` · `wait` · `wait-until` · `forever` · `repeat` · `repeat-until` |

`state 0` is the script's entry and its `block` is the **hat block** — so a task that has not
started yet glows its `when ⚑ clicked`, which is what Scratch does. `0xFFFF` means the task ran
to the end and is deliberately absent from the map: there is no block to glow.

**Why the block id is percent-encoded.** Scratch's block-id alphabet includes `*` and `/`
(`generateId`, and `generateAssetId` already exists to dodge the same alphabet for filenames).
A raw id therefore contains `*/` about once in every 400 blocks, which would terminate the C
comment the header lives in — and `cComment`'s `*/` → `* /` guard would silently corrupt the id
instead. `encodeURIComponent` plus `*` → `%2A` leaves an alphabet with no `/`, no `*` and no
whitespace, and `decodeURIComponent` round-trips it exactly.

**Why `{debug: true}` and not always.** Block ids are minted afresh by every parse, so emitting
them unconditionally would make the same program produce different C run to run. That breaks
the `C → pseudocode → C` fixed point the other three languages hold themselves to (and which
`test/ctarget.test.mjs` enforces), and it makes emitted C undiffable. The constraint was found
by that test, not reasoned out in advance, and it is the right answer anyway: the map is a
debugger's working data, not part of the program.

`{debug: true}` therefore means one thing — *a build you can debug* — and it does two:

1. emits the yield map, and
2. **forces the cooperative form even for a single script.** One `WHEN` otherwise compiles to
   straight-line code in `main()` with no `<task>_state` and so no Level 1 position at all,
   which would leave the debugger blind on the commonest beginner project. The scheduler costs
   the Timer-0 ISR and one dispatch loop and changes nothing semantically — a lone task that
   yields simply re-enters at once. Release builds are untouched.

Readers: `readYieldMap(source)` in `cToPseudocode.js` returns the decoded map, and
`stc_symtab.py` merges it into `yields[].block`. A C file without the header still produces a
symbol table, just without block ids — hand-written firmware has no blocks to point at.

**Drift is an error, not a warning.** If the header's `(task, state)` set disagrees with the
`case` labels `stc_symtab` scans out of the same file, it raises. A symbol table that maps a
state to the wrong block is worse than one that maps nothing: it would glow a confidently wrong
block, which is this project's recurring failure mode (a multimeter reading ohms on a live
circuit, an LED brightness of `0.0000` from a mis-named terminal).

## 7b. What building it changed — three things the plan did not know

Recorded because each one is a fact about what actually ships, not a preference.

**The C API says yes to something it does not do.** `dbg_step` returns success for every step
kind, and its `STEP_LINE` branch is commented *"Would need a line table. For now, treat as
step-insn."* A front end asking to step one C line would get one instruction and no sign of the
difference — the precise failure §1 exists to prevent. The JS target therefore **omits `line`
from `capabilities().steps` and refuses the call with a reason**. Same for watchpoints: the C
has `BP_WRITE`/`BP_READ`, but no `emu_dbg_set_bp_write` is exported, so they are reported
absent rather than accepted and ignored.

**`emu_dbg_run_until_ns` halts the target when the budget expires**, and `dbg_halt` announces
that as `HALT_USER`. Run it once per frame, as §6 requires, and a UI subscribed to `onHalt`
sees a halt sixty times a second while the program runs happily. `runFor()` swallows that one
and reports it as a return value (`'budget'` vs `'halted'`), then puts the target back to
running — so nothing above that line ever learns the emulator technically stopped. This is why
the session renders **intent**, never `target.state()`.

**Neither WASM build exposes a heap view.** The exported runtime is `ccall cwrap addFunction
removeFunction UTF8ToString stringToUTF8` and nothing more, so every entry point that hands JS
a *pointer* is unreachable: `emu_dbg_read_mem`, and the `struct dbg_halt_reason *` the halt
callback receives. Memory is therefore read through the value-returning accessors
(`emu_get_code/_iram/_sfr/_xdata`, which compute exactly what `dbg_read_mem` computes), and the
halt reason is reconstructed from the accessors plus what the wrapper asked for. The one thing
genuinely lost is `bp_id`; it is recovered by matching the halted PC against the breakpoints we
set, and reported absent when that is ambiguous rather than guessed. Exporting `HEAPU8` from
the build would let both go back to the direct route.

Two consequences worth acting on separately: the copy of `bw-board` vendored into
`brickwright-lite` is **stale across most files** (`mna.js` alone differs by 423 lines), and its
`emu8051-adapter.js` still loads a HEX image through `wasm.HEAPU8` — which is `undefined` in the
shipped build, so tier-2 simulation would throw on the first `loadHex`. Upstream already fixed
it via `stringToUTF8`; `npm run sync:bw-board` is overdue.

## 7c. What wiring the UI changed — three more

**A debug build is not a release build, twice over.** `generateC({debug: true})` forces the
scheduler, and `--debug` makes SDCC stop tail-merging returns so line records map cleanly:
measured at **8 of 39 hex records different and two bytes larger** on a two-task fixture (a
`JNB/RET` pair becomes `JB/SJMP`). The program behaves the same; it is not the same bytes. So
**a symbol table is only ever valid for the image it was built with** — ask for both in one
request, never pair a table with a separately compiled release image, and never flash a debug
image.

**`emu_init` re-allocates code memory, and the adapter's constructor calls it.** Building the
board adapter *after* loading the image therefore wipes the program — and the symptom is not
an error. The CPU NOP-sleds through 64 KB of zeroes, reaches whatever address a breakpoint
sits at, and halts there with every task still at state 0. It looks like a working debugger
pointing at the wrong block, and the only tell is the position. The order is now adapter →
board → image → target, with an assertion on the reset vector to make a recurrence loud. This
is the same failure shape as `simulation.md`'s "brightness 0.0000 from a mis-named terminal":
plausible and wrong beats obviously broken, every time.

**Glow every task, not one.** The first version lit "the first task whose state resolves",
which lit the *other* script's hat when a breakpoint stopped task 1. A cooperative scheduler
really does have several scripts each sitting somewhere, and Scratch itself glows every
running script rather than choosing between them — so the runner lights them all, and a
finished task (`0xFFFF`) simply drops out. Verified: with a breakpoint on the second script's
`REPEAT`, the panel lights `control_repeat` **and** the first script's `control_wait`, which
is exactly where that script is.

A fourth, smaller: webpack rejects Emscripten's `require("node:fs")` while *parsing* — an
unknown URI scheme fails before resolution, so `resolve.fallback` cannot catch it. A
`NormalModuleReplacementPlugin` strips the `node:` prefix and the fallback then maps it to
nothing. And the `.wasm` is not a module, so webpack never emits it: it is copied to
`static/` and found through `document.baseURI`, which keeps it correct under GitHub Pages'
subpath as well as at a domain root.

## 8. Order

1. **The yield map** — `@bw yield` in `generateC`, `block` through `stc_symtab.py`. *(done)*
2. **`DebugTarget` + the run-loop owner** — `bw-board/src/emu8051-debug.js` and
   `debug-session.js`, 31 tests, the target's own suite running against the real WASM. ⚑ ⏸ ⏭ ⏹
   are working verbs against a simulation. *(done)*
3. **Block glow and breakpoint-on-block** — done 2026-08-09, verified headless:
   `npm run smoke:debugger` marks a block before anything is built, runs, and asserts the
   program halts there with that block lit. Right-click → **"Pause here"** is on every block's
   context menu, gated on the project declaring pins so an ordinary Scratch project sees
   nothing; marked blocks carry a red outline via a CSS class, re-applied on every workspace
   change because Blockly rebuilds a block's SVG on load, drag and undo.

   The controls landed in the **Circuit tab**, not the stage header as §1 describes. The
   reason is worth keeping: the stage header renders for *every* project, including pure
   Scratch ones, so putting a debugger strip there means teaching shared chrome to recognise
   a hardware project. The Circuit tab is already the hardware surface, already gated on
   declared pins, and already shows the board you want to watch while stepping. The glow
   lands in the Blocks tab either way — `glowBlock` does not care which tab is open. Move it
   once the chrome knows what an STC project is; nothing else changes.
4. `debugState` honoured in the Circuit tab: freeze, no catch-up, live `setControl`.
5. **"Under the hood" drawer** — done 2026-08-09. §4b maps it pane by pane and key by key
   against emu8051's TUI, including the three places it deliberately differs.
6. The live target, after the bench session on `10-live-firmware`. It slots into the same UI by
   construction — which is the payoff for having branched on `capabilities()` from the start.

Steps 1–3 are the product. Everything after is depth.

## 9. Out of scope

Level 2 block-fidelity tracing (`BW_TRACE`) until someone needs it and can pay the flash; the
gdb remote serial protocol; `sdcdb`; profiling and coverage; and any debugger for the **host** C
target — that one runs on a PC where a real debugger already exists.
