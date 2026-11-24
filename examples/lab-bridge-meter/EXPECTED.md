# lab-bridge-meter — expected behaviour

## Circuit
- Two 9 V batteries give ±9 V around ground (`gnd_2`). One half of an LM358 (`lm358_10`) runs from them; the second half is parked.
- Input: a 10 kΩ knob (`potentiometer_6`) between two 39 kΩ resistors from +9 V and −9 V, so its wiper spans about ±1 V; or, with the slide switch (`slide_switch_9`) on the other side, a 50 Hz sine of 1 V peak from the function generator. The input goes to the + input.
- Feedback: the output feeds a bridge. Top arms: two silicon diodes, cathodes on the meter's + lead. Bottom arms: a red LED ("plus", `led_13`) to the − input and a green LED ("minus", `led_14`) to the output, anodes on the meter's − lead. The meter (a bare movement, full scale at one milliamp) is the bridge diagonal.
- The − input goes to ground through 1 kΩ (`resistor_16`).

## Observable behaviour
- The loop holds the − input at the input voltage, so the 1 kΩ carries Vin / 1 kΩ, and that current has to pass the bridge. Whichever way it flows, it crosses the meter from + to −: the meter reads |Vin|, 1 mA per volt.
- As loaded (knob at three quarters, +0.51 V): 0.51 mA on the meter, carried by the red LED; the green one is dark.
- Knob at a quarter (−0.51 V): the same 0.51 mA on the meter, now through the green LED.
- Knob in the middle: nothing.
- The output moves as far as it must to drive the current through a diode, the meter and an LED (about 2.6 V for +0.5 V in). The meter does not see those drops: they sit inside the loop.
- Sine input: the meter current follows the size of the sine on both half-waves; its average is 2/π of the peak (0.64 mA for 1 V). Red and green take turns, each lit for a bit under half of every cycle.

## What this verifies
1. A rectifier inside an op-amp's feedback loop has no dead zone: diode and LED drops are made up by the output.
2. A bridge turns both directions of current into one direction through the meter: full-wave rectification.
3. Which bridge arm carries the current shows the sign of the input.

```assert
# knob at three quarters: +0.51 V in, the − input follows it exactly, and the
# output stands a diode, the meter and an LED higher
net potentiometer_6.wiper V 0.511 +-0.005
net lm358_10.1_neg V 0.511 +-0.005
net lm358_10.1_out V 2.65 +-0.1
```
