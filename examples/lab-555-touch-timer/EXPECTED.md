# lab-555-touch-timer — expected behaviour

## Circuit
- 9 V supply. 555 monostable (timer_555_3): 100 kΩ (resistor_4) and 22 µF (polarized_cap_5), about 2.4 s.
- Trigger input: 22 MΩ (resistor_7) to +9 V; a fingertip (button_11 with 470 kΩ of skin, resistor_12) to ground; a bare wire near a mains cable (field_probe_13: its knob is how close the cable is, up to 10 pF).
- GUARD (switch_8, closed): adds 2.2 MΩ (resistor_9) to +9 V and 10 nF (capacitor_10) to the +9 V rail.
- Output → relay coil (relay_14, flyback diode); its contact lights the yellow lamp LED through 1 kΩ.

## Observable behaviour
- Guarded, cable brought close: the trigger hums between 8.75 V and 9.24 V; nothing happens.
- Finger on (50 ms): the trigger drops to 1.71 V, the output goes high (7.2 V), the relay pulls in, the lamp lights (7.08 mA). One second later still on; three seconds later off.
- GUARD open, cable away: quiet. Cable brought close: the trigger swings by tens of volts and the timer fires by itself; the relay pulls in.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: guarded hum 8.753–9.243 V; finger 1.713 V; unguarded hum −0.45 … 9.47 V (clamped by the 555's input junctions).

## What this verifies
1. A finger (470 kΩ) against 2 MΩ of pull-up brings the trigger below 3 V: 9 V × 0.47 / 2.47 = 1.7 V.
2. A high-impedance input is an antenna: a few picofarads to a 230 V cable push 50 Hz current into 22 MΩ and swing it far below 3 V. A lower pull-up and 10 nF to a rail shrink the hum to about a quarter of a volt.
3. The 555 monostable holds its output for 1.1 × 100 kΩ × 22 µF ≈ 2.4 s however short the touch.

## Simulation notes
The 555's trigger input is clamped by its input junctions, a diode drop beyond either rail, so the unguarded trigger swings between about −0.45 V and 9.47 V; it crosses 3 V either way. The guard capacitor goes to +9 V rather than ground so that at switch-on it holds the trigger high instead of starting the timer; for 50 Hz hum either rail is the same.

```assert
# switch-on: trigger and guard capacitor held high, timer idle, timing capacitor empty
net timer_555_3.trigger V 8.996 +-0.01
net capacitor_10.a V 8.996 +-0.01
net timer_555_3.output V 0 +-0.01
net timer_555_3.threshold V 0.001 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 40** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-touch-timer` prints them one by one.
<!-- engine-provenance -->
