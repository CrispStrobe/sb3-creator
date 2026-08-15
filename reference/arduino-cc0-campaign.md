# The Arduino CC0 campaign — wire everything, multiple ways

**Source:** `github.com/arduino/arduino-examples`, CC0-1.0 at repo level
(local clone: `~/code/arduino-examples`). CC0 means we may port directly —
no clean-room needed — but every ported example carries a provenance line
(`ported from arduino-examples <path>, CC0`) so the history stays honest.

**Why this campaign (the doctrine):** attempting wirings and reading example
runs is how the last audit found seven engine bugs. So: port the whole CC0
corpus, AND wire every component we have in MULTIPLE distinct circuits, used
multiple ways, with real simulation assertions on each. Every ported sketch is
simultaneously a teaching example and a regression test; every multi-wiring
sweep is a bug hunt. Escalation unchanged: `pass | content-fix | app-bug |
engine-bug`, engine bugs to the coordinator (mna.js/board.js are frozen).

## Category map

| Category | Sketches | Status | Notes |
|---|---|---|---|
| 01.Basics | 6 | port all | all parts exist |
| 02.Digital | 9 | port all | tone* exercise tone()/noTone() lowering |
| 03.Analog | 6 | port all | AnalogWriteMega needs the mega target |
| 04.Communication | 12 | port most | Midi needs the MIDI-monitor face; MultiSerial needs Serial1 on mega + a second monitor; Graph/PhysicalPixel/Tweak → serial-print adaptations (no Processing side) |
| 05.Control | 6 | port all | pure software — exercises arrays/switch in generateC |
| 06.Sensors | 4 | port all | ADXL3xx + Memsic2125 need NEW device models (coordinator, below); Knock (piezo) + Ping (ultrasonic) exist |
| 07.Display | 2 | port all | bargraph + led_matrix row/column exist |
| 08.Strings | 14 | port all | pure software — the String-ops coverage test for the C generator |
| 09.USB | 7 | OUT OF SCOPE | Leonardo HID; no USB device model, stated not pretended |
| 10.StarterKit p02-p15 | 14 | port all | p13 touch → touch_ttp223 module (better pedagogy than the CapacitiveSensor library); p14 → serial variant |
| 11.ArduinoISP | 1 | OUT OF SCOPE | a programmer, not a lesson |

≈ 73 in-scope sketches. Parts inventory check (2026-08-15): ultrasonic,
tmp36, piezo (knock), bargraph, tilt_sensor, touch_ttp223, h-bridge,
dc_motor, servo, relay, hd44780, shift_register, rgb_led, ldr all EXIST.

**Missing device models (coordinator takes these):**
- `adxl335` — analog 3-axis accelerometer (ADXL3xx sketch, and the first
  device needing the ORIENTATION input face contract: the face reports
  tilt, the model maps it to three analog outputs, zero-g bias + sensitivity
  from the datasheet).
- `memsic2125` — 2-axis thermal accelerometer with PWM duty output (100 Hz,
  50% = 0 g). Small, models after adxl335's orientation contract.

**Missing faces (bw-circuit-ui):**
- orientation/tilt input (drag or sliders → {x,y,z} g) feeding adxl335 /
  memsic2125 / mpu6050 alike — ONE contract, three consumers.
- MIDI monitor: decode note-on/off from TX at 31250 baud, render the notes.
- second serial monitor for mega MultiSerial.
- stimulus buttons for knock (tap the piezo) and distance (set the
  ultrasonic target range) if not already in the fabric path.

## The multi-wiring sweeps (bw-audit)

For EVERY part kind in the registry (not just campaign-new ones): at least
three distinct circuits per part, each with a different electrical role or
failure mode, run through audit-solve with assertions. Vary: polarity,
pull-up vs pull-down, PWM vs steady drive, series vs parallel loads, wrong
wiring on purpose (expected-refusal cases). A part that cannot survive three
wirings is a finding, not a nuisance. Log per-part in the sweep ledger;
silent truncation of the part list is forbidden — say what was skipped.

## Definition of done, per ported example

1. Pseudocode (.bw) + circuit JSON + expected trace, through the L1 gates.
2. intro.md (EN+DE): age band, prerequisites, teaches-DAG links.
3. Runs on every device in its `devices` list (uno at minimum; mega/nano/
   pico/eater6502 where the parts allow) — the projection machinery decides.
4. Provenance line naming the CC0 source sketch.
5. Any engine discrepancy escalated with the failing netlist attached.
