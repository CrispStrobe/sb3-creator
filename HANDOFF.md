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
