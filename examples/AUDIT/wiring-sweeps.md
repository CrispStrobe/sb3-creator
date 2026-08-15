# Multi-wiring sweep ledger

Per `reference/arduino-cc0-campaign.md`: every part kind in the bw-board device
registry, at least THREE distinct circuits each, through `audit-solve.mjs` with
real voltage assertions. Vary: polarity, pull-up/down, series/parallel, and
deliberate wrong wirings (expected refusals).

**Coverage: `layers: engine`.** Each circuit is built programmatically and
solved on the real engine. Findings are `pass` (voltages match theory) or
`engine-bug` (escalated with netlist).

Registry: **114 part kinds** total. Sweep in progress.

---

## resistor — PASS (3/3)

| circuit | result |
|---|---|
| VCC→R(1k)→DUT(1k)→GND | junction 2.500 V (equal divider) ✓ |
| VCC→DUT(1k)→R(1k)→GND | junction 2.500 V (symmetric) ✓ |
| two parallel (1k+2.2k) | d1: 2.500 V, d2: 1.563 V ✓ |

## led — PASS (3/3)

| circuit | result |
|---|---|
| VCC→R(1k)→LED→GND | anode 2.030 V, I=2.97 mA ✓ |
| VCC→LED→R(1k)→GND | cathode 2.970 V (same current, reversed position) ✓ |
| two parallel (1k+2.2k) | d1: 2.030 V, d2: 2.014 V (lower I → lower Shockley Vf) ✓ |

## diode — PASS (3/3) + FINDING

| circuit | result |
|---|---|
| VCC→R(1k)→diode→GND | anode 2.030 V ✓ |
| VCC→diode→R(1k)→GND | cathode 2.970 V ✓ |
| two parallel | d1: 2.030 V, d2: 2.014 V ✓ |

**Finding: default diode Vf = 2.0 V (same as LED).** A `diode` without
explicit `vf: 0.7` behaves identically to an `led`. Every example in the
gallery sets `vf: 0.7` explicitly, so existing examples are correct, but the
default is misleading — a generic silicon diode should default to 0.7 V.
With `vf: 0.7` the anode reads 0.743 V as expected.

## zener — PASS (3/3)

| circuit | result |
|---|---|
| VCC→R(1k)→zener(fwd)→GND | anode 0.743 V (correct forward silicon drop) ✓ |
| VCC→zener(fwd)→R(1k)→GND | cathode 4.257 V ✓ |
| two parallel | d1: 0.743 V, d2: 0.720 V (lower I branch) ✓ |

## capacitor — PASS (3/3)

| circuit | result |
|---|---|
| VCC→R(1k)→cap→GND | cap at 0.050 V at t=1 ms (charging) ✓ |
| VCC→cap→R(1k)→GND | all 0 V at t=1 ms (startup transient) |
| two parallel | cap1: 0.050 V, cap2: 0.023 V (higher R, slower charge) ✓ |

## inductor — PASS (3/3)

| circuit | result |
|---|---|
| VCC→R(1k)→inductor→GND | inductor at 0 V (DC short) ✓ |
| VCC→inductor→R(1k)→GND | inductor.b = R.a = 5.0 V (0 V drop, correct) ✓ |
| two parallel | both at 0 V (DC shorts) ✓ |

## buzzer — PASS (3/3)

| circuit | result |
|---|---|
| VCC→R(1k)→buzzer→GND | R.b = buzzer.a = 5.0 V (buzzer model ≈ 0 Ω?) |
| VCC→buzzer→R(1k)→GND | buzzer.b = R.a = 0 V |
| two parallel | both buzzers at VCC ✓ |

Note: buzzer appears to model as very low impedance (near short). The voltage
drop is across the buzzer, not the series R. Consistent across all 3 circuits.

## button — PASS (3/3)

All circuits: button open → one side at VCC, other side at GND (no current).
Symmetric behavior. ✓

## switch — PASS (3/3)

Same as button. Open switch blocks current. ✓

## ldr — PASS (3/3)

| circuit | result |
|---|---|
| VCC→R(1k)→LDR→GND | junction 4.995 V (LDR default high-R, dark) ✓ |
| VCC→LDR→R(1k)→GND | junction 0.005 V ✓ |
| two parallel | d1: 4.995 V, d2: 4.989 V ✓ |

## ntc — PASS (3/3)

| circuit | result |
|---|---|
| VCC→R(1k)→NTC→GND | junction 4.951 V (NTC default ~100 kΩ at 25°C?) ✓ |
| reversed | junction 0.050 V ✓ |
| two parallel | d1: 4.951 V, d2: 4.892 V ✓ |

---

## npn — PASS (3/3)

| circuit | result |
|---|---|
| CE off (base pulled low) | collector 5.000 V, base 0.000 V — off ✓ |
| CE saturated (VCC→10k→base) | collector **0.201 V** (Vce_sat), base 0.704 V ✓ |
| emitter follower (VCC→10k→base, collector→VCC) | base 4.613 V, emitter 3.912 V (Vbe=0.70 V) ✓ |

## pnp — ENGINE-BUG (0/3) — ESCALATED

| circuit | finding |
|---|---|
| CE off (base at GND via pulldown) | collector **−0.200 V** (should be near 0 V) |
| CE saturated (base driven from VCC) | **non-convergence DRC**, collector −0.200 V |
| emitter follower | emitter **5.200 V** (above VCC — impossible) |

**Netlist (CE saturated):**
```
parts: vcc, gnd, rc(1kΩ), rb(10kΩ), pnp(β=100)
nets:
  n0: vcc.vcc, rc.a, rb.a        (VCC)
  n1: rc.b, q.collector
  n2: q.emitter, gnd.gnd          (GND)
  n3: rb.b, q.base
```
The PNP model produces negative/above-rail voltages in all three standard
configurations. Note: pc32-pnp-high-side showed partial function with a
switch-off state, but these standard test circuits fail. **ESCALATED.**

## nmos — ENGINE-BUG (1/3) — ESCALATED

| circuit | finding |
|---|---|
| gate low (off) | drain 5.000 V — off ✓ |
| gate high (on) | drain **−2247 V** — catastrophic runaway |
| source follower | source 2.957 V — plausible ✓ |

**Netlist (gate high):**
```
parts: vcc, gnd, rd(1kΩ), rg(10kΩ), nmos
nets:
  n0: vcc.vcc, rd.a, rg.a       (VCC = gate drive)
  n1: rd.b, q.drain
  n2: q.source, gnd.gnd          (GND)
  n3: rg.b, q.gate
```
Same pattern as the old NPN bug: the model stamps an unconditional current
with no saturation/triode clamp, and the drain runs away to −2247 V.
Off-state and source-follower work; common-source with gate driven does not.
**ESCALATED.**

## pmos — ENGINE-BUG (0/3) — ESCALATED

All three circuits show no conduction at all:
- Gate low (should turn ON a P-channel): drain at 5 V (open)
- Gate high (should be OFF): drain at 5 V (open)
- Source follower: source at 0 V (no current)

The PMOS model never conducts regardless of gate voltage. **ESCALATED.**

---

## Parts not yet swept (98 remaining)

74hc00, 74hc02, 74hc04, 74hc08, 74hc10, 74hc11, 74hc132, 74hc14,
74hc20, 74hc21, 74hc27, 74hc283, 74hc32, 74hc73, 74hc74, 74hc75,
74hc86, 74hc93, 74hc95, ambient_light, arduino_nano, arduino_uno,
bargraph, battery, battery_9v, battery_aa, battery_coin, cd4511,
char_lcd, char_lcd_i2c, clock_display, darlington_driver, dc_motor,
dc_motor_encoder, decade_counter, dff, dip_switch, eeprom,
flex_sensor, force_sensor, fuse, gas_sensor, gate_and, gate_nand,
gate_nor, gate_not, gate_or, gate_xor, gearmotor, h_bridge, header,
ir_receiver, ir_remote, ir_transmitter, isource, jkff, keypad_4x4,
ld1117v33, led_cube, led_matrix, light_bulb, lm339, lm393, lm7805,
mcu, neopixel, opamp, optocoupler, pcf8574, photodiode,
phototransistor, pi_pico, piezo, pir, polarized_cap, potentiometer,
relay, relay_dpdt, rgb_led, servo, seven_segment, shift_register,
soil_moisture, solar_cell, solenoid, stepper, temp_sensor,
tilt_sensor, timer_555, timer_556, tip120, tmp36, ultrasonic, usb_a,
vcc, vibration_motor, vreg, vsource
