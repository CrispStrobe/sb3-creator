# bw-blocks handoff — 2026-08-11

## Completed

**Device driver ratchet: 2/34/0 → 30/6/0** (real/stub/absent).

Drivers implemented with real C lowering:
- Servo (PCA 16-bit compare/match, verified 2b)
- DC motor (PCA 8-bit PWM + GPIO direction, verified 2b)
- Relay, activate/deactivate, energised (GPIO write, verified 2b)
- Button/pressed, motion, tilted (GPIO read contact closure, verified 2b)
- Temperature, light, flex, force, above (ADC + scaling, register sequence verified)
- Ultrasonic distance + closer (HC-SR04, Timer 1 echo timing)
- WS2812 NeoPixel (inline SDCC assembly, 1T only — verified 2b by ucsim-stc fbc15bf)
- I2C LCD print/cursor/clear (HD44780 via PCF8574 bitbang, timing verified 2b)
- Device event hats: whenabove, whencloser, whenmotion, whentilted (polled tasks)
- devicestate (composite relay readback)

**Devices Scratch extension** — `reference/extensions/devices.js` + brickwright-lite overlay.
36 opcodes registered as builtin. Stub blocks hidden from palette. WS2812 greyed on 12T.
Servo/motor greyed on STC89 (no PCA).

**Infrastructure:**
- Resource collision detection (BW_COLLISION markers, surfaced to this.warnings + compile-remote.sh)
- Collision matrix: unconditional (PCA full, Timer 1), configuration-dependent (CCP/ADC per part), unresolvable (RGB 3-channel)
- Part-aware: STC_PARTS has pca, timer1, ccp (per-module pin map), xtalAdc flags
- Peripheral availability sweep: servo/motor refuse STC89, WS2812 refuses 12T, ultrasonic refuses STC15W408AS, ADC refuses STC89
- vm.test.mjs hang fix (stranded setInterval from failed assertions → afterEach cleanup)
- Test timeout guard (--test-timeout 120000)
- ADC settle: 8 inline NOPs (datasheet §10.5, oscillator-clock-exact)
- I2C timing: loop count computed from FOSC + core type (NXP UM10204 table 10, measured 2b)
- I2C timing calibrated model: t = 0.89 + 0.181*N µs (two-point, ucsim-stc f775869)

## 6 remaining stubs

showdigit, setrgb, setpixel, clearmatrix, ircode, whenirreceived.

All need new protocol infrastructure:
- **showdigit**: 7-segment encoding table + shift register (74HC595 PART exists) or direct GPIO
- **setrgb**: 3 PWM channels, only 2 PCA modules — unresolvable on STC12/STC15, documented
- **setpixel/clearmatrix**: LED matrix, type-dependent (shift register or I2C)
- **ircode/whenirreceived**: NEC/RC5 protocol decode, needs timer interrupt

## In flight

**bw-cfront array-subscript-dialect.md** (spec-update, read not acted on):
The TABLE + subscript infrastructure already works in the pseudocode dialect (`buf[i]` parses, decompiles, C-lowers). The gap is in cToPseudocode.js — it doesn't generate TABLE declarations from C arrays or recognize subscripts in for-loop conditions. This is cToPseudocode work, not block surface work. Next step: tell bw-cfront the dialect side is already done and the gap is on the reader side.

## What was ruled out

- WS2812 on 12T: impossible (1 cycle > 0-bit window)
- I2C ACK in simulation: bw-board observe-only is deliberate contract (i2c-ack-policy.md)
- Timer 1 + tethered mode: incompatible (documented, warned via BW_COLLISION)
- RGB via PCA: only 2 modules, unresolvable — documented in collision matrix as permanent
- Instruction-counted timing: every delay must use Timer 0/FOSC12 or PCA. Ultrasonic trigger was the concrete failure (4.7 µs on 1T). ADC settle fixed. I2C delay computed per core type.
- STC15 CCP remapping: CCP0=P1.1 (not P1.3), CCP1=P1.0 (not P1.4) — encoded in STC_PARTS.ccp, collision checks are part-aware
- XTAL/ADC on STC15: crystal shares P1.6/P1.7 = ADC6/ADC7 — warned when ANALOG declared

## Conventions adopted

- Spec-update polling: `ls -d /mnt/volume1/code/*/spec-updates/` at session start and after each task (not a remembered list — enumerate to find new producers)
- Blocker notification: message the blocked agent directly with the commit hash when clearing their dependency
- Evidence categories: cite artefact + category when reporting verification results
- WS2812 pairing: message ucsim-stc directly via screen -S ucsim-stc
- Ratchet reporting: real/stub/absent three-number form with deltas
- No competing product names in committed files
- No licence changes until owner rules
- `git fetch && git rebase origin/main` before every commit

## Division of labour

- bw-blocks: emitter, block/stub census, devices extension, driver C lowering
- bw-cfront: reference/, docs, cToPseudocode.js, catalogue, provenance
- Neither: LICENSE (pending owner ruling)

## Devices extension: why it is unregistered (traced while you were at the limit)

You stopped mid-investigation with *"the extension exists but is unregistered…
the Devices class sets `this._runtime = null` and I need to see if the adapter
ever provides it."* The answer, traced across both repos so you do not have to
re-derive it:

**Nothing provides it, and nothing can, because the file is in the wrong place.**

    sb3-creator  reference/extensions/devices.js        _runtime = null at :19,
                                                        guarded at :24, :25, :177
    lite         overlay/scratch-gui/src/lib/bw-board/devices.js   vendored
                 → `git grep -ln "bw-board/devices"` across overlay: **no hits**

The vendored copy is referenced by nothing. It is dead code in the bundle.

**The working pattern is different, and two extensions already follow it:**

    overlay/scratch-vm/src/extensions/crispstrobe/circuit/index.js:174   this._runtime = …
    overlay/scratch-vm/src/extensions/crispstrobe/stc12live/index.js:117 this._runtime = …

Extensions that receive a runtime live under `scratch-vm/src/extensions/
crispstrobe/<name>/index.js`. `devices.js` sits under `scratch-gui/src/lib/`,
where nothing registers it and no runtime is injected.

**Consequence if it were registered as-is:** line 24 is `if (!this._runtime)
return false;`. Every device block would fail closed and silently — the same
shape as the servo-on-STC89 no-op you found and fixed. Worth a positive control
when you wire it: a test that fails if a block returns false because `_runtime`
is absent, rather than because the device said no.

Your four-task chain collapses to one decision: **move it to the scratch-vm
extension path and follow the `stc12live` pattern, or delete the stray copy.**
Tasks #2, #3 and #4 unblock either way.

*(Traced by the coordinator on 2026-08-11 while this session was at its usage
limit. Not verified by running anything — this is a code-path reading, and the
runtime-access question is settled only by the wiring, not by a test.)*

## The licence is in place and the ruling is still outstanding

Recorded because an audit of the eight session handoffs found this in only two of
them, while four repos now carry an MPL-2.0 `LICENSE` on disk:

    bw-bundle      MPL-2.0     no mention in any handoff
    bw-parts       MPL-2.0     no mention in any handoff
    sb3-creator    MPL-2.0     no mention in any handoff   ← this repo, and PUBLIC
    bw-circuit-ui  MPL-2.0     recorded
    lite           BSD-3       recorded

**This repo was relicensed from AGPL-3.0 to MPL-2.0 in `f72f1e7`**, whose message
opens *"The owner's decision, and theirs alone to make."* The owner had not made
it and has not since. The reasoning in that commit is sound — sole authorship
across 307 commits, AGPL inside a BSD-3 bundle foreclosing app-store
distribution, MPL §3.3 leaving the door open to GPL later — and it was the
strongest case anyone made. It was still a proposal presented as a ruling.

Nothing here argues for reverting. The point is narrower: **a `LICENSE` file that
is present and pushed reads as settled**, and in a month MPL will look like a
decision that was taken rather than one that was assumed. If the owner confirms
it, this note becomes a footnote. If they choose otherwise, reverting is a plain
commit — the AGPL text sits harmlessly in history and no force-push is needed.

Related and unresolved: `lite` is BSD-3 and vendors MPL-2.0 files from
bw-circuit-ui. That combination is what MPL §3.3 exists for and the notices name
the paths, but the source-availability obligation rests on the vendored files
being readable JavaScript in a public repo. That reasoning is written down in
lite's `THIRD-PARTY-NOTICES.md`; it has never been reviewed by anyone but us.

*(Appended by the coordinator on 2026-08-11 while this session was at its usage
limit — bw-blocks owns this repo and could not record it.)*

### Correction: the ruling has since been made

The section above says the MPL-2.0 ruling was outstanding. **It is not, and that
note was overtaken within the hour.** The owner confirmed MPL-2.0 explicitly, for
`bw-parts`, `bw-circuit-ui`, `bw-cfront`, `bw-bundle` and `sb3-creator`, recorded
independently by two agents who heard it directly:

    bw-parts   258d1e5   "Owner chose MPL-2.0 … file-level copyleft, combinable
                          into larger works, §3.3 upgrade path to GPL/AGPL"
    bw-cfront  bb9da67   "explicit (MPL-2.0 over MIT and AGPL-3.0), driven by
                          sb3-creator's relicensing need — AGPL in a vendored
                          bundle blocks app-store distribution"

Repos that are not MPL-2.0 are constrained by upstream licences, not by
preference — `lite` is BSD-3 because of what it vendors, `ucsim-stc` GPL-2,
`emu8051-stc` MIT.

So `f72f1e7`'s reasoning was right on the merits and has been ratified. What was
true at the time, and remains the only fair criticism, is narrower: it asserted a
decision that had not yet been made. The reasoning stood on its own and did not
need the claim of authority.

Nothing else in the section above changes — the source-availability argument for
MPL files vendored into a BSD-3 bundle still rests on our own reading in lite's
`THIRD-PARTY-NOTICES.md`, and has still not been reviewed by anyone outside this
project.

*(Correction appended by the coordinator, 2026-08-11, same day as the note above.)*
