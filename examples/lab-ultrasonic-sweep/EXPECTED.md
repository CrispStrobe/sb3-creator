# lab-ultrasonic-sweep — expected behaviour

## Circuit
- 9 V battery, two NPN transistors as an astable multivibrator: 4.7 kΩ collector resistors, 1 nF cross-coupling capacitors.
- Both 33 kΩ base resistors are fed from the wiper of a 10 kΩ pot (the pitch knob) that sits above a 15 kΩ resistor to ground: the knob sets the base feed voltage between 5.4 V and 9 V.
- A slide switch puts a 2.2 nF tuning capacitor in parallel with one of the 1 nF capacitors (as authored it is out).
- The second collector feeds a magnetic earphone through 10 nF and 10 kΩ.

## Observable behaviour
- A very high whistle. Turning the knob up raises it: from about 12 kHz to about 22 kHz.
- Somewhere on the way up the tone disappears for the listener: most adults stop hearing between about 14 and 18 kHz, younger people hear higher. The oscillator keeps running; only the ear has reached its limit.
- With the tuning capacitor in, the same knob covers a lower range, about 5.5 to 11.6 kHz, so the knob's turn is spread over different, finer steps.

## Why the knob changes the pitch
Each base capacitor is pulled up from about −8 V towards the base feed voltage through 33 kΩ until the transistor turns on at about 0.6 V. A higher feed voltage gets there sooner: a shorter half-period and a higher tone.

## Measured on the engine
Collector frequency from 0.6 ms to 1.2 ms after switch-on:

| knob | tuning capacitor | frequency |
|---|---|---|
| 0 | out | 11.8 kHz |
| 1/2 | out | 15.6 kHz |
| 1 | out | 22.0 kHz |
| 0 | in | 5.5 kHz |
| 1 | in | 11.6 kHz |

## What this verifies
1. A two-transistor astable's frequency depends on the voltage its base resistors return to, so one pot sweeps it.
2. The ear has an upper frequency limit (a hearing test).
3. Extra capacitance lowers an RC oscillator's frequency.

## Simulation notes
The earphone is coupled through 10 kΩ so that its coil does not disturb the collector it is fed from. `test/lab-circuits-r6b.test.mjs` reads the frequency at the collector for the knob and switch settings above.

```assert
# t = 1 ms, knob at mid position, tuning capacitor out: Q1 off, Q2 on.
net potentiometer_3.wiper V 5.649 +-0.05
net potentiometer_3.b V 4.237 +-0.05
net capacitor_11.a V 8.677 +-0.2
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ultrasonic-sweep` prints them one by one.
<!-- engine-provenance -->
