# lab-knock-flicker — expected behaviour

## Circuit
- 9 V battery. A crystal earphone (earphone_3) lies on the table as the pickup; each knock reaches it as a dull thud (120 Hz, fading in about 20 ms), four knocks a second. Its Sound slider (soundDb) is how hard you knock; as built 0, no knocking.
- Q1, an emitter follower (bases on two 1 MΩ, 10 kΩ emitter), takes the crystal's signal: the crystal is electrically a capacitor of about ten nanofarads, a very high impedance at 120 Hz.
- Q2 amplifies it (10 kΩ collector load, 1 MΩ collector-to-base bias).
- Two diodes and 1 µF pump the bursts into 2.2 µF (47 kΩ drains it in about 0.1 s), which drives Q3 through 10 kΩ; red LED (led_21) with 470 Ω in Q3's collector.

## Observable behaviour
- No knocking: the LED is dark.
- Knock hard (110 dB at the pickup): the LED flashes at each knock, for about a tenth of a second.
- Knock softly (80 dB): it stays dark.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: quiet 0 mA; at 110 dB a 14.9 mA flash with the knock at 0.5 s, about 75 ms above 5 mA; at 80 dB 0 mA.

## What this verifies
1. A pickup with a high internal impedance needs an amplifier with a high input impedance in front: the emitter follower.
2. The flash appears only when the amplified knock is large enough to charge the hold capacitor past Q3's threshold (about 0.6 V plus two diode drops of signal).

## Simulation notes
The knock is the engine's `ring` sound at the pickup (strikeHz 4, decayS 0.02, soundHz 120): a burst every 0.25 s from the start of the simulation. The thuds make the solver take small steps: about 0.1 s of computing per simulated millisecond while they ring.

```assert
# 1 ms after switch-on, no knocking: Q3 off
net npn_19.collector V 7.92 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-knock-flicker` prints them one by one.
<!-- engine-provenance -->
