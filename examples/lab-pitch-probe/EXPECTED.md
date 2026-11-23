# lab-pitch-probe — expected behaviour

## Circuit
A 555 astable on 9 V whose upper timing resistor leaves the board through two probes. The path from +9 V to DISCHARGE is: R_fixed = 4.7 kΩ → probe A → whatever bridges the probes → probe B. On the bench the probes are the PROBES switch (open = nothing between them) and the thing between them is the MATERIAL pot, a 1 MΩ pot wired as a variable resistor (from a short up to 1 MΩ). R2 = 10 kΩ runs from DISCHARGE to THRESHOLD/TRIGGER, and C = 10 nF to ground. The output drives a piezo and a yellow LED (1 kΩ) to ground. CONTROL is decoupled with 10 nF; RESET is tied to +9 V.

## Observable behaviour
- **Probes apart (start):** no current can reach the capacitor, so it never charges and the 555 never toggles. The output sits high at about 8.66 V: the LED is lit and the speaker is silent. An insulator sounds the same.
- **Something between the probes:** f = 1.44 / ((R_fixed + R_probe + 2·R2) · C).

| What bridges the probes | R_probe | f by formula | f in the simulation |
|---|---|---|---|
| metal (MATERIAL at 0 %) | 0 Ω | 5830 Hz | about 5630 Hz |
| pencil line | 10 kΩ | 4150 Hz | about 4020 Hz |
| piece of fruit (start value) | 47 kΩ | 2008 Hz | about 2000 Hz |
| two damp fingers | 470 kΩ | 291 Hz | about 290 Hz |
| dry skin (MATERIAL at 100 %) | 1 MΩ | 141 Hz | about 140 Hz |

- **Lower resistance, higher pitch.** R_fixed stops the pitch from running away when the probes are shorted.
- **The LED gets brighter as the pitch falls.** The output is high while C charges through R_fixed + R_probe + R2 and low while it discharges through R2 alone, so a large R_probe makes the high part of each cycle longer: about 60 % high with metal, 86 % with fruit, 99 % with dry skin.

## What this verifies
1. Conductors and insulators differ only in how much they resist: the 555 turns that resistance into a pitch.
2. f is inversely proportional to the total timing resistance.

```assert
# probes apart: no oscillation, output parked high
net timer.output V 8.66 +-0.05
net c_t.a V 0.00 +-0.01
```
