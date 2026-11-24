# lab-loud-counter — expected behaviour

## Circuit
5 V supply.

- **Microphone:** a magnetic earphone (2 kΩ, 0.1 H) used backwards. As authored a steady 200 Hz tone at 90 dB SPL reaches it (`soundDb`, `soundWave` tone, `soundHz`).
- **Amplifier:** one half of an LM358, inverting: 10 µF and 1 kΩ from the earphone into the - input, 1 MΩ feedback. Together with the earphone's own resistance the gain is about 300. The earphone's other end and the + input both sit on the wiper of the sensitivity pot (10 kΩ below 10 kΩ from +5 V, so 0 to 2.5 V; authored at 0.8, 2.0 V). The 10 µF blocks DC, so the output rests at the wiper voltage. The second half is unused (inputs grounded).
- **Counter:** the amplifier output drives input A of a 74HC93 directly; QA feeds input B; four red LEDs (470 Ω) show QA..QD. The counter switches at half the supply. (The 74HC93 stands in for a CMOS 7-stage binary counter.)

## Observable behaviour
- The output rests at 2.0 V, below the counter's switching level.
- At 90 dB the amplified tone swings about 0.9 V each way, peaks near 2.9 V: every cycle crosses 2.5 V, and the counter counts 200 per second (8 in 40 ms). The LEDs run through the binary count.
- At 80 dB the swing is about 0.3 V: the output never reaches 2.5 V and nothing is counted.
- The sensitivity pot moves the rest voltage, and with it how loud the sound must be. At half travel (1.25 V rest) even the 90 dB tone no longer counts.

## What this verifies
1. An amplifier lifts a microphone's millivolts to logic level.
2. The resting voltage sets a loudness threshold: only sound above it clocks the counter.

```assert
# t = 1 ms: the pot sets the + input; the - input follows it; nothing counted yet.
net potentiometer_9.wiper V 2.00 +-0.02
net lm358_7.1_neg V 2.00 +-0.02
net 74hc93_10.qa V 0.00 +-0.05
```
