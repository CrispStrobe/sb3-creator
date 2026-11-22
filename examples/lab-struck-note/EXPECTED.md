# lab-struck-note — expected behaviour

## Circuit
Two separate jobs on one 9 V supply: a tone and a loudness.

- **Tone:** a 555 astable that runs all the time. R1 = 1 kΩ (+9 V to DISCHARGE), R2 = 15 kΩ (DISCHARGE to THRESHOLD/TRIGGER), C = 100 nF to ground; CONTROL decoupled with 10 nF.
- **Envelope:** the KEY button charges C_env = 47 µF from +9 V through R_strike = 100 Ω. A decay path drains it all the time: R_min = 4.7 kΩ in series with the DECAY pot (47 kΩ, wired as a variable resistor, starting at 40 %, about 18.8 kΩ).
- **Output stage:** the 555 output drives an NPN through R_base = 10 kΩ. The piezo sits between the envelope node and the transistor's collector, so every time the transistor switches on, the speaker gets the whole envelope voltage.

## Observable behaviour
- **Silent at rest:** C_env is empty, so although the 555 keeps running the speaker has nothing to switch. The tone is there; the loudness is zero.
- **Strike:** a 50 ms tap of KEY fills C_env almost instantly (R_strike is only 100 Ω): the speaker swings about 8.5 V peak to peak.
- **Decay:** after the tap the envelope sinks exponentially with τ = (R_min + DECAY) × C_env = (4.7 kΩ + 18.8 kΩ) × 47 µF ≈ 1.1 s.

| Time after the tap | envelope | speaker swing |
|---|---|---|
| 0.1 s | 8.6 V | 8.5 V |
| 0.8 s | 4.5 V | 4.5 V |
| 1.5 s | 2.4 V | 2.4 V |
| 2.2 s | 1.25 V | 1.2 V |

- **The pitch does not move:** about 455 Hz the whole time (the formula 1.44 / ((R1 + 2·R2)·C) gives 464 Hz). Only the loudness changes, which is what makes it sound struck rather than switched.
- **Hold the key:** the envelope stays full and the note sustains, like holding a piano key.
- **DECAY:** turning it up lengthens the ring (up to about 2.4 s at 100 %), turning it down shortens it to a click (about 0.22 s at 0 %).

## What this verifies
1. An RC discharge can shape loudness over time: attack (fast charge) and decay (slow discharge).
2. Tone generation and envelope are independent jobs, the basis of sound synthesis.

```assert
# at rest, KEY not pressed
net c_env.a V 0.00 +-0.01
```
