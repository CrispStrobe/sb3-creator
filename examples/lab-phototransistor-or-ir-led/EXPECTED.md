# lab-phototransistor-or-ir-led — expected behaviour

## Circuit
- 9 V battery. A white lamp LED (220 Ω, on a slide switch, on as authored) shines on two clear parts from 2 cm (two `light_path` parts, medium air; the first one's knob is its distance, 1 to 20 cm).
- Branch A: a phototransistor, collector to plus, emitter through 470 Ω to a red indicator LED and ground.
- Branch B: an IR LED in the same position, cathode to plus (where the phototransistor's collector is), anode through 470 Ω to a second red indicator LED and ground. It is used as a light sensor (`photoSensitivity` 1e-5, its photocurrent in amps at full light), which it would do in real life too, weakly.
- No other active part: each part under test is the only thing that could let current through its branch.

## Observable behaviour
| | lamp on, 2 cm | phototransistor at 10 cm | lamp off |
|---|---|---|---|
| branch A (phototransistor) | 2.82 mA, indicator glows | 0.12 mA, almost dark | nothing |
| branch B (IR LED) | 15 µA, indicator dark | 15 µA | nothing |

- Only the phototransistor makes its indicator glow: light lets it conduct like a switch, and the current comes from the battery.
- The IR LED sits reverse biased; light only frees a few microamps in it, far too little to light an LED. (Turned round it would conduct as an ordinary diode, lamp or not: also a way to tell them apart.)

## What this verifies
1. A phototransistor is a light-controlled switch for battery current.
2. A photodiode (here an IR LED) only delivers its own tiny photocurrent.

```assert
# Lamp on, 2 cm: phototransistor branch conducts, the IR LED branch barely.
net phototransistor_6.emitter V 2.96 +-0.05
net led_8.anode V 1.64 +-0.03
net led_11.anode V 1.37 +-0.03
```
