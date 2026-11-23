# lab-applause-meter — expected behaviour

## Circuit
- **Sound:** a 400 Hz, 3 V peak sine source stands for an amplified microphone.
  The simulator's sound module only reports a level, not a waveform, so the
  waveform comes from a source. The **clap** button connects it while held: a
  short press is one clap, repeated presses are applause.
- **Detector:** 4.7 µF coupling capacitor → node X. A clamp diode from ground
  to X stops X from going far below zero, so the capacitor shifts the whole
  sine upwards. A second diode passes the peaks on, through a 1 kΩ attack
  resistor, into the 22 µF hold capacitor.
- **Release:** the hold capacitor drains through 220 kΩ to ground and through
  the 47 kΩ base resistor into the transistor.
- **Indicator:** NPN with a green LED and 470 Ω in its collector, from 9 V.

## Expected behaviour
- Quiet: hold capacitor empty, LED dark.
- One clap (button pressed for 50 ms): the hold capacitor charges within a few
  milliseconds (fast attack through 1 kΩ) and the LED flashes up to about 3 mA.
  Afterwards the capacitor drains slowly and the LED fades over roughly a
  second (slow release).
- Applause (a clap every 0.2 s): each burst tops the capacitor up before it has
  had time to drain, so the level climbs and the LED stays on — brighter than
  after a single clap.
- After the last clap the LED fades out the same slow way.

## Measured on the engine
Driven in order by `test/lab-circuits-1.test.mjs` (the sound source is a
waveform, so a single-instant solve cannot speak for it):

| moment | hold capacitor, volts | LED, milliamps |
|---|---|---|
| quiet | 0 | 0 |
| end of one 50 ms clap | 2.17 | 3.18 |
| 0.25 s later | 1.76 | 2.31 |
| 1 s later | 1.06 | 0.81 |
| after four claps, 0.2 s apart | 2.92 | 4.76 |
| 1.5 s after the last clap | 0.97 | 0.61 |

## What this verifies
1. A diode is a one-way valve for charge: the capacitor fills fast and empties slowly.
2. Attack and release are two separate time constants.
3. The same peak-hold idea is in VU meters, compressors and radio AGC.

```assert
# quiet at 1 ms: nothing has reached the hold capacitor
net chold.pos V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d19b5e4` and `bw-circuit-ui@6b4d702` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-applause-meter` prints them one by one.
<!-- engine-provenance -->
