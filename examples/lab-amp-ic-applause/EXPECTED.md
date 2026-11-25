# lab-amp-ic-applause — expected behaviour

## Circuit
- 9 V battery.
- Microphone: a loudspeaker (8 Ω) into +IN of an LM386 (−IN grounded, 10 µF across the gain pins 1 and 8: gain 200, bypass pin open). Its Sound slider plays a sung vowel; as authored the room is quiet.
- Peak hold: output → 1 µF → node P; a germanium diode (1N34A) from ground to P, a second one from P to the hold node H (a pump: each upward swing pushes charge into H, each downward swing recharges the 1 µF from ground).
- Hold capacitor at H, chosen by the HOLD slide switch: 10 µF (left, as authored) or 47 µF (right). 220 kΩ from H to ground.
- LED driver: H → 22 kΩ → base of NPN Q1; green LED and 470 Ω from +9 V to Q1's collector.

## Observable behaviour
- Quiet room, and talking (80 dB): LED dark.
- Loud applause at the microphone (110 dB): within a few tens of milliseconds the LED lights and stays lit while the applause goes on.
- When it stops the LED does not go out at once: it fades over a few hundred milliseconds (10 µF) or over more than a second (47 µF).

## Measured on the engine
Noise (applause; the scenario picks this waveform) at 110 dB for 60 ms, then silence:

| hold capacitor | LED at the end of the applause | H then | LED 300 ms later | LED 1.2 s later |
|---|---|---|---|---|
| 10 µF | 4.42 mA | 1.65 V | 0.79 mA | 0 mA |
| 47 µF | 2.32 mA | 1.19 V | 1.61 mA | 0.45 mA |

10 µF in more detail after the applause stops: 2.57 mA at 100 ms, 1.45 mA at 200 ms, 0.78 mA at 300 ms, dark by 600 ms. Talking (vowel, 80 dB, 60 ms): 0 mA. The slider's own vowel at 110 dB lights it too: 3.05 mA after 60 ms.

## What this verifies
1. The loudspeaker-microphone and the LM386 (gain 200) turn applause into swings of a volt or so.
2. Two diodes and a capacitor pump only the peaks into the hold capacitor; it charges quickly and empties slowly (through 220 kΩ and the transistor's base), so the LED shows the loudness of the last moments rather than each single clap.
3. A larger hold capacitor fills more slowly and holds longer.

## Simulation notes
`test/lab-circuits-r6g.test.mjs` plays 60 ms of noise at the microphone in both HOLD positions and reads the LED current at the end and 300 ms and 1.2 s later; it also plays the vowel at 110 dB and at 80 dB.

```assert
# t = 1 ms, quiet: amplifier at half supply, the hold capacitor nearly empty, Q1 off, LED dark.
net lm386_4.vout V 4.500 +-0.02
net lm386_4.inp V 0.000 +-0.01
net resistor_13.a V 0.393 +-0.1
net npn_14.collector V 7.611 +-0.3
net led_16.anode V 9.000 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 42** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-applause` prints them one by one.
<!-- engine-provenance -->
