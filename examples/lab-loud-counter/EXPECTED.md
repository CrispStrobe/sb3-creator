# lab-loud-counter — expected behaviour

## Circuit
5 V supply.

- **Signal:** a function generator stands in for an audio source (for example a radio's earphone output): a 100 Hz sine, 0.5 V peak as authored (param `amplitude`).
- **Coupling:** 100 nF from the signal to input A of a 74HC93. 100 kΩ from the wiper of the threshold pot (10 kΩ across the supply, authored at 0.45) biases that input at about 2.25 V, just below the counter's own switching level, half the supply.
- **Counter:** QA feeds input B; four red LEDs (470 Ω) show QA..QD. The counter is the only active part: its own input threshold decides what is loud enough. (The 74HC93 stands in for a CMOS 7-stage binary counter.)

## Observable behaviour
- 0.5 V signal: the input swings between about 1.6 V and 2.74 V; every peak crosses the switching level, and the counter counts 100 per second (8 in 80 ms).
- 0.1 V signal: the peaks reach only about 2.35 V. Nothing is counted.
- Pot lower (0.35, bias 1.75 V): even the 0.5 V signal stays below the level. The pot sets how loud the signal must be.

## What this verifies
1. A logic input has a switching level: a signal is only counted when it crosses it.
2. A DC bias set close to that level turns the counter into a loudness-gated counter.

```assert
# t = 1 ms: the 100 nF still charging towards the bias; the signal at 0.29 V; nothing counted.
net potentiometer_6.wiper V 2.21 +-0.02
net capacitor_4.a V 0.295 +-0.01
net 74hc93_7.qa V 0.00 +-0.05
```
