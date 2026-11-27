# lab-ptc-tone-bridge — expected behaviour

## Circuit
- 9 V supply. An LM386 (`lm386_3`, pins 1 and 8 joined) relaxation oscillator (1 MΩ / 1 MΩ, 220 kΩ, 22 nF) makes a square wave of about 1.1 kHz.
- Through 10 µF it feeds a bridge: 1 kΩ to node A and the silicon PTC sensor (`ptc_sensor_10`, r25 = 2000, i.e. two kilohms at 25 °C) to ground; 1 kΩ to node B and 1.8 kΩ plus a 470 Ω balance potentiometer (`potentiometer_13`) to ground.
- A magnetic earphone (`earphone_14`, 2 kΩ) between A and B is the detector. The sensor sits in its own surroundings (Temperature slider, 25 °C as built).

## Observable behaviour
- 25 °C: the bridge is balanced and the earphone is practically silent.
- Away from 25 °C, either way, the tone comes back, louder the further away: 0.14 V at 15 °C or 35 °C, 0.32 V at 50 °C.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, earphone voltage peak to peak, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| sensor surroundings | earphone |
|---|---|
| 15 °C | 0.143 V |
| 25 °C | 0.0004 V |
| 35 °C | 0.135 V |
| 50 °C | 0.318 V |

## What this verifies
1. A bridge can be fed with alternating current as well; at balance A and B carry the same waveform and the detector between them hears nothing.
2. A null detector cannot tell which way the bridge is off: warmer and colder both sound.

## Simulation notes
The oscillator's square wave reaches the bridge through 10 µF, so the bridge sees it without the DC part.

```assert
# t = 1 ms, 25 C: both bridge nodes at the same voltage
net ptc_sensor_10.a V 0.366 +-0.01
net resistor_12.a V 0.366 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 30** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ptc-tone-bridge` prints them one by one.
<!-- engine-provenance -->
