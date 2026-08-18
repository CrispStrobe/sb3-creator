# microbitPlus — Sensors / Motion group opcode list

Source of truth for the **sensors and motion reporter blocks** in the
`microbitPlus` gallery extension.  Derived from
`stc/docs/MICROBIT-EXTENSION-STUDY.md` **§5.3** (the v1 block set) and
**§5.4** (Backend-S lowering to the in-browser MicroPython WASM sim).

Every block in this group is a **reporter (R)** — it answers a number.
None is a command, boolean, or hat.

---

## Motion / orientation reporters

| opcode | block text | shape | args | menus | Backend-S MicroPython |
|--------|-----------|-------|------|-------|----------------------|
| `accel` | acceleration [AXIS] | R | AXIS | `x`, `y`, `z`, `strength` | `accelerometer.get_x()` / `.get_y()` / `.get_z()` / `math.sqrt(x**2+y**2+z**2)` — returns milli-g |
| `pitch` | pitch (\u00b0) | R | \u2014 | \u2014 | `accelerometer.get_values()` \u2192 `math.atan2(-y, -z) * 180 / math.pi` |
| `roll`  | roll (\u00b0)  | R | \u2014 | \u2014 | `accelerometer.get_values()` \u2192 `math.atan2(x, -z) * 180 / math.pi` |
| `compass` | compass heading (\u00b0) | R | \u2014 | \u2014 | `compass.heading()` \u2014 returns 0\u2013359 |
| `magforce` | magnetic force [AXIS] | R | AXIS | `x`, `y`, `z`, `absolute` | `compass.get_x()` / `.get_y()` / `.get_z()` / `math.sqrt(x**2+y**2+z**2)` \u2014 returns \u00b5T |

### AXIS menu (shared by `accel` and `magforce`)

| menu value | display text | notes |
|------------|-------------|-------|
| `x` | x | left\u2013right axis |
| `y` | y | front\u2013back axis |
| `z` | z | up\u2013down axis |
| `strength` | strength | (accel only) Euclidean magnitude of x/y/z |
| `absolute` | absolute | (magforce only) Euclidean magnitude of x/y/z |

The menu items `strength` and `absolute` are semantically identical
(Euclidean magnitude); they are named differently because the physical
units differ (milli-g vs \u00b5T) and the MicroPython API doesn't have a
single call for either.

### pitch/roll computation (Backend-S)

The micro:bit MicroPython API does not expose pitch/roll directly.
Backend-S computes them from `accelerometer.get_values()`:

```python
import math
x, y, z = accelerometer.get_values()
pitch = math.atan2(-y, -z) * 180 / math.pi   # nose-up positive
roll  = math.atan2(x, -z)  * 180 / math.pi   # tilt-right positive
```

This matches the BBC micro:bit reference definition (Tait\u2013Bryan angles,
Z-down convention).

---

## Environment reporters

| opcode | block text | shape | args | menus | Backend-S MicroPython |
|--------|-----------|-------|------|-------|----------------------|
| `light` | light level | R | \u2014 | \u2014 | `display.read_light_level()` \u2014 returns 0\u2013255 |
| `temp`  | temperature (\u00b0C) | R | \u2014 | \u2014 | `temperature()` \u2014 on-die sensor, integer \u00b0C |
| `sound` | sound level | R | \u2014 | \u2014 | `microphone.sound_level()` \u2014 returns 0\u2013255 (v2 only; v1 returns 0). Lazily enables the mic on first read. |

### v1/v2 split for `sound`

micro:bit V1 has no microphone.  The sim (micropython-microbit-v2-simulator)
is a V2 model, so `microphone.sound_level()` works.  On real V1 hardware
via Backend-B the reporter must return 0 and the block should be greyed
(same pattern as other hardware-absent peripherals).

---

## Integration with the dialect

The pseudocode dialect expresses these as `read <name>` reporters once the
device is declared.  The mapping from dialect to block to MicroPython is
the subject of `DUAL-LOWERING-ORACLE.md` in this directory.

## Sim bridge contract

Backend-S feeds MicroPython strings to the WASM sim over the existing
`postMessage` bridge (`sb3-creator-micropython`'s protocol).  Reporters
read back from the sim's sensor state mirror:

```
block.accel('x')  ->  sim.eval('accelerometer.get_x()')  ->  number
block.compass()   ->  sim.eval('compass.heading()')       ->  number
block.light()     ->  sim.eval('display.read_light_level()')  ->  number
block.temp()      ->  sim.eval('temperature()')           ->  number
block.sound()     ->  sim.eval('microphone.sound_level()')    ->  number
```

The sim caches sensor values between frames (streaming architecture,
MICROBIT-EXTENSION-STUDY.md \u00a73); the bridge reads are cheap.
