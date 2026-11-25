# lab-motor-stall-cutout — expected behaviour

## Circuit
- 9 V supply. An LM386 (`lm386_14`) drives a small motor (`dc_motor_encoder_15`, flyback diode) with a 2.2 Ω sense resistor below it. Its − input is held at about three tenths of a volt by 1.5 MΩ from +9 V; its + input gets its drive through 560 kΩ, and that resistor hangs on the anode of a latch, so the latch can take the drive away.
- The latch is a two-transistor thyristor (`pnp_6`, `npn_7`, 22 kΩ anode-to-gate and 22 kΩ gate-to-cathode) fed from the main slide switch (`slide_switch_3`) through 1 kΩ and a red TRIP LED (`led_5`).
- The sense voltage reaches the gate through 4.7 kΩ with 47 µF to ground: only a current that lasts a few tenths of a second can fire it, not the start-up surge.

## Observable behaviour
- Running with a light load: about 340 rad/s, the latch stays off.
- Hold the shaft (a heavy load): the motor current rises to the LM386's limit, after a few tenths of a second the latch fires, the TRIP LED lights and the drive collapses to 0.9 V. The motor stays off even when released.
- Main switch off and on again: the motor restarts.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| step | motor | drive | TRIP LED |
|---|---|---|---|
| running (load 0.002 N·m) | 342.7 rad/s | high | dark |
| held (load 0.05 N·m), 0.4 s | 0 | 0.88 V | 1.71 V (lit) |
| released | 0 | low | lit |
| main switch off and on | 342.7 rad/s | high | dark |

## What this verifies
1. A motor that cannot turn has no back-EMF, so it draws its full current: a current sensor sees the stall.
2. A delay (RC) separates a lasting overload from the short surge at start-up.
3. A thyristor latch remembers the trip until someone resets it, so the motor does not start again by itself.

```assert
# t = 1 ms: the latch is off, drive on the + input
net pnp_6.emitter V 7.63 +-0.05
net lm386_14.inp V 0.626 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 14** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-motor-stall-cutout` prints them one by one.
<!-- engine-provenance -->
