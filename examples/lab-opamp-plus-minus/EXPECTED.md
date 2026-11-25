# lab-opamp-plus-minus — expected behaviour

## Circuit
- Two 9 V batteries in series (vsource_3 on top, vsource_4 below): their junction is ground (gnd_2); the LM324's VCC pin sits nine volts above it and its GND pin nine volts below.
- INPUT pot (potentiometer_5, 10 kΩ) from −9 V to +9 V; its wiper drives both sections (as built: at 0.6, +1.8 V). The voltmeter voltmeter_14 shows the wiper.
- Section 1: a bare comparator, + input on the wiper, − input on 0 V. Its output drives 1 kΩ into a red LED (led_8, to 0 V) and a green LED (led_9, from 0 V) back to back.
- Section 2: a follower of the wiper. Its output drives 1 kΩ into a red LED (led_11) and a green LED (led_12) back to back to 0 V; voltmeter_13 reads the voltage across that pair.

## Observable behaviour
- The comparator's red LED is lit for every input above zero, the green one for every input below. The changeover takes less than a ten-thousandth of the knob's travel: 1.8 mV either side of zero already drives the output to −8.66 V or +7.22 V. The comparator can hardly be balanced.
- The pair voltmeter follows the input exactly between about −1.9 V and +1.6 V (no LED conducts there), then stops: +1.70 V with the knob fully up (red LED lit, 5.5 mA), −2.02 V fully down (green LED lit). One threshold in each polarity.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: the knob a ten-thousandth of its travel below the middle puts the comparator at −8.655 V, a ten-thousandth above at +7.222 V. Pair: +1.695 V (knob up), −2.015 V (knob down); with the knob at 0.45 or 0.55 it follows the input exactly.

## What this verifies
1. An op-amp's open-loop gain (about 10^5) makes a comparator that switches within millivolts.
2. With a ± supply the output and the input can swing either side of 0 V.
3. Each LED conducts in one direction only, from its own threshold up.

## Simulation notes
The LM324 model swings to 5 mV above its GND pin and 1.5 V below its VCC pin, less what the LED current takes: −8.66 V and +7.22 V here. It has no input offset, so the comparator changes over at exactly 0 V; a real chip's few millivolts of offset would move that point by a few ten-thousandths of the knob.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_6.1_out V 7.222 +-0.03
net voltmeter_13.a V 1.506 +-0.02
net voltmeter_14.a V 1.8 +-0.01
```
