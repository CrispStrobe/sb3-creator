# Power amplifier as a split supply

Op-amp circuits often want a plus and a minus supply. A 9 V battery has only one. A power amplifier with its inputs grounded sits at half the supply and can deliver real current — a sturdy midpoint, the 0 V of a ±4.5 V supply.

**Teaches:** virtual ground, split supply, inverting amplifier, load regulation

## What to do

Click **Sim**. Turn the input knob (potentiometer_7) from one end to the other and watch the red and green LEDs and the voltmeter (voltmeter_14). Then move the slide switch (slide_switch_6) to the right — the midpoint now comes from two resistors — and turn the knob again.

## What you should see

- Left: the op-amp's output is the input mirrored about the midpoint. Input below the middle: red, and the meter shows plus; above: green, and the meter shows minus. The midpoint stays at 4.5 V throughout.
- Right: the midpoint itself wanders by more than two volts as the LEDs draw current, and the mirror no longer works.

## Why it works

The amplifier's output stage keeps its output at its internal half-supply point however much current flows in or out. Two resistors can only hold their midpoint as long as nobody draws current from it.
