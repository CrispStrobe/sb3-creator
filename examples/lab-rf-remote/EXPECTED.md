# lab-rf-remote — expected behaviour

## Circuit
- 9 V battery. Transmitter: a Meissner oscillator — ferrite-rod coil with the tuning capacitor (0.30) in the collector of an NPN, the coupling winding to a 22 kΩ / 22 kΩ divider held by 10 nF, emitter 1 kΩ with 1 nF. The divider's top is fed through a button: the transistor is biased, and oscillates, only while the button is held.
- Receiver, half a metre away: a second ferrite rod (`linkTo` the transmitter's rod) with its tuning capacitor at 0.309. Its coupling winding drives the gate of an n-MOSFET (threshold 2 V; bias 100 kΩ / 47 kΩ held by 10 nF); 4.7 kΩ drain load. The amplified RF goes through 1 nF to a germanium diode (100 kΩ DC return) into 47 nF and straight into the LM386 (gain 20), whose output rests at half the supply.
- Indicator: 470 Ω, a red LED and a 3.3 V zener in series from the LM386 output to ground — it lights only once the output is well above its resting half supply (zener plus LED drop).

## Observable behaviour
- Button released: the LM386 output rests at about 4.53 V and the LED is dark.
- Button held: the carrier reaches the receiver; the MOSFET makes its RF about 12 times bigger (59 mV at the gate, 0.68 V at the drain), the diode delivers about 0.13 V of DC, the LM386 output rises to about 7.2 V and the LED lights (about 4.5 mA).
- Released again: within a few milliseconds the output is back near 4.57 V and the LED is dark.

## Measured on the engine
bw-board f48ea7ce, `test/lab-circuits-r7b.test.mjs` (10 ms idle, 5 ms key held, 8 ms released): idle output 4.527 V with the LED dark; held 6.21 V, LED 2.63 mA, the drain's RF 14.9 times the gate's; released 4.56 V, LED dark again. Re-measured 2026-11-26: the transmitter's swing is lower after bw-board #760's band changes (3.5 V of RF at its tank; on b094eb22 the held key gave 7.16 V and 4.51 mA).

## What this verifies
1. A carrier alone, detected and DC-amplified, can switch something: the simplest radio remote control.
2. An RF stage ahead of the detector and a DC-coupled amplifier after it.

```assert
# power-on: supply, the LM386 at half the supply, the zener holding the LED's cathode
net vsource_2.pos V 9.00 +-0.01
net lm386_24.bypass V 4.50 +-0.05
net zener_27.cathode V 3.35 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 33** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-rf-remote` prints them one by one.
<!-- engine-provenance -->
