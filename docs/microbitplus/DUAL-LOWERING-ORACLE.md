# microbitPlus — Dual-Lowering Oracle

The **dual-lowering oracle** is the acceptance test for the `microbitPlus`
extension.  It proves that a program authored as **blocks** and a program
authored in the **BrickWright dialect** converge on the **same MicroPython
output** \u2014 and therefore the same observable behaviour on the simulator or
hardware.

Source: `stc/docs/MICROBIT-EXTENSION-STUDY.md` \u00a75.5 and
`stc/docs/MICROBIT-NATIVE.md` \u00a76 item 5.

---

## 1. Why this matters

The BrickWright pipeline has two entry points for the same program:

```
dialect (.bw)  \u2500\u2500\u2192  parse()  \u2500\u2500\u2192  blocks  \u2500\u2500\u2192  generateMicroPython()  \u2500\u2500\u2192  .py
blocks (GUI)   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2192  generateMicroPython()  \u2500\u2500\u2192  .py
```

If these two paths produce different MicroPython for the same logical
program, one of the two lowerings has a bug.  The oracle catches it.

---

## 2. The v1 mapping table

Every row is one operation.  The **dialect** column is the BrickWright
pseudocode form; the **block** column is the `microbitPlus` opcode + args;
the **MicroPython** column is the Backend-S output the dual lowering must
converge on.

### Display & LEDs

| # | dialect | microbitPlus block | MicroPython |
|---|---------|-------------------|-------------|
| D1 | `show pattern [matrix]` | `showmatrix MATRIX` | `display.show(Image('09900:09900:09900:00000:00000'))` |
| D2 | `show text "Hello"` | `showtext "Hello"` | `display.scroll('Hello')` |
| D3 | `scroll text "Hi" delay 120 ms` | `scrolltext "Hi" 120` | `display.scroll('Hi', delay=120)` |
| D4 | `clear display` | `cleardisplay` | `display.clear()` |
| D5 | `plot x 2 y 3 on` | `plot 2 3 on` | `display.set_pixel(2, 3, 9)` |
| D6 | `plot x 2 y 3 off` | `plot 2 3 off` | `display.set_pixel(2, 3, 0)` |

### Buttons, logo, gestures

| # | dialect | microbitPlus block | MicroPython |
|---|---------|-------------------|-------------|
| B1 | `when button_a pressed` | `whenbutton A pressed` | `if button_a.was_pressed():` (edge-poll in `bw_script`) |
| B2 | `read button_a` | `isbutton A` | `button_a.is_pressed()` |
| B3 | `when logo touched` | `whenlogo touched` | `if pin_logo.is_touched():` (edge-poll) |
| B4 | `when shake` | `whengesture shake` | `if accelerometer.was_gesture('shake'):` (edge-poll) |

### Motion / orientation (sensors)

| # | dialect | microbitPlus block | MicroPython |
|---|---------|-------------------|-------------|
| M1 | `read accel x` | `accel x` | `accelerometer.get_x()` |
| M2 | `read accel y` | `accel y` | `accelerometer.get_y()` |
| M3 | `read accel z` | `accel z` | `accelerometer.get_z()` |
| M4 | `read accel strength` | `accel strength` | `math.sqrt(accelerometer.get_x()**2 + accelerometer.get_y()**2 + accelerometer.get_z()**2)` |
| M5 | `read pitch` | `pitch` | `_pitch()` (helper: `math.atan2(-y, -z) * 180 / math.pi`) |
| M6 | `read roll` | `roll` | `_roll()` (helper: `math.atan2(x, -z) * 180 / math.pi`) |
| M7 | `read compass` | `compass` | `compass.heading()` |
| M8 | `read magforce x` | `magforce x` | `compass.get_x()` |
| M9 | `read magforce y` | `magforce y` | `compass.get_y()` |
| M10 | `read magforce z` | `magforce z` | `compass.get_z()` |
| M11 | `read magforce absolute` | `magforce absolute` | `math.sqrt(compass.get_x()**2 + compass.get_y()**2 + compass.get_z()**2)` |

### Environment (sensors)

| # | dialect | microbitPlus block | MicroPython |
|---|---------|-------------------|-------------|
| E1 | `read light` | `light` | `display.read_light_level()` |
| E2 | `read temperature` | `temp` | `temperature()` |
| E3 | `read sound` | `sound` | `microphone.sound_level()` |

### Pins / GPIO

| # | dialect | microbitPlus block | MicroPython |
|---|---------|-------------------|-------------|
| P1 | `turn on led1` (P0, active-low) | `digitalwrite P0 0` | `pin0.write_digital(0)` |
| P2 | `turn off led1` (P0, active-low) | `digitalwrite P0 1` | `pin0.write_digital(1)` |
| P3 | `set pin P0 to 1` | `digitalwrite P0 1` | `pin0.write_digital(1)` |
| P4 | `read pot` (P1, analog) | `analogread P1` | `pin1.read_analog()` |
| P5 | `set pin P2 analog 50 %` | `analogwrite P2 50` | `pin2.write_analog(512)` |
| P6 | `set pin P0 pull up` | `setpull P0 up` | `pin0.set_pull(pin0.PULL_UP)` |
| P7 | `when pin P0 touched` | `whentouch P0` | `if pin0.is_touched():` (edge-poll) |

### Actuators

| # | dialect | microbitPlus block | MicroPython |
|---|---------|-------------------|-------------|
| A1 | `set buzzer to 440 hz` | `playtone 440 -1` | `music.pitch(440, pin=pin0)` |
| A2 | `play note C4` | `playnote C4` | `music.pitch(262, 500, pin=pin0)` |
| A3 | `stop buzzer` | `stoptone` | `music.stop()` |
| A4 | `set servo to 90` | `servo P1 90` | `pin1.write_analog(int(90/180*1023))` |

### Radio

| # | dialect | microbitPlus block | MicroPython |
|---|---------|-------------------|-------------|
| R1 | `radio on group 5 power 3` | `radioon 5 3` | `import radio; radio.config(group=5, power=3); radio.on()` |
| R2 | `radio send number 42` | `radiosendnum 42` | `radio.send(str(42))` |
| R3 | `radio send text "hi"` | `radiosendstr "hi"` | `radio.send('hi')` |
| R4 | `when radio receives a number` | `whenradionum` | `if (_r := radio.receive()) is not None:` (edge-poll) |
| R5 | `read last radio number` | `radiolastnum` | `_radio_last_num` (variable) |

---

## 3. Convergence invariant

For any program P expressible in both dialect and blocks:

```
generateMicroPython(parse(dialectText(P)))
  ===
generateMicroPython(blocksOf(P))
```

"===" means textually identical after normalising:
- trailing whitespace
- blank-line runs (collapse to single blank line)
- the `@bw` marker comments (line numbers differ; strip before compare)

The `@bw` markers are emitted by the MicroPython writer for debugger
line-mapping.  They must be present in both outputs (tested separately)
but their line numbers legitimately differ because the dialect parser
and the block GUI assign different source positions.

---

## 4. Test strategy

The skeleton acceptance test is `test/microbit-oracle.test.mjs`.  It is
**skip-gated** until the `microbitPlus` extension scaffold lands (the
`getInfo()` registration, the `generateMicroPython` micro:bit path, and
the dialect \u2192 blocks round-trip for at least the sensor reporters).

### Gate condition

```js
const GATE = existsSync('src/extensions/microbitPlus/index.js')
  ? false
  : 'microbitPlus extension scaffold not yet landed';
```

### Test shape

Each row in the mapping table (\u00a72) becomes one sub-test:

1. Build the **blocks** representation (a minimal project with one
   `when green flag clicked` script containing the operation).
2. Build the **dialect** representation (the `.bw` text for the same
   program).
3. Run `generateMicroPython()` on both.
4. Assert the outputs match (after normalisation).

Rows that exercise hats (B1, B3, B4, R4) test the edge-poll scaffolding
in `bw_script()`.  Rows that exercise reporters (M1\u2013E3) test the
sim-bridge `eval()` path.

### Phasing

- **Phase 1 (this commit):** skeleton test file, skip-gated, with the
  mapping table encoded as data.  Proves the test harness loads.
- **Phase 2 (after scaffold lands):** un-gate; failures are real bugs.
- **Phase 3 (after Backend-B lands):** extend the oracle to assert that
  Backend-B's BLE command packets match Backend-S's MicroPython for the
  same blocks.
