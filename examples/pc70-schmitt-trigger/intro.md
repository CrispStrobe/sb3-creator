---
level: advanced
age: 14+
prereqs: [pc69-nand-inverter, pc06-rc-charge]
teaches: [Schmitt-trigger, hysteresis, clean-edges, RC-ramp]
---
## What you see
A NAND gate as a Schmitt trigger: a slowly rising RC ramp at the input still produces a clean switching edge at the output. The LED switches crisply even though the input voltage rises gently.

## Try this
1. Click **Sim** — the LED starts ON (input below the switching threshold).
2. The capacitor charges slowly — after the time constant (R·C = 1 s) the LED switches off.
3. The transition is sharp, not gradual.

## What is going on
A real Schmitt trigger (e.g. 74HC132) has two thresholds: an upper and a lower (hysteresis). When the input is between them, the output stays stable — no chattering. Here the NAND gate shows the effect: despite a slowly rising voltage at the RC input, the output switches cleanly.

## Go further
- [pc06-rc-charge](../pc06-rc-charge) — the RC charging curve at the input.
- [pc71-nand-entpreller](../pc71-nand-entpreller) — debouncing through a latch.
