# Shift register from three op-amps

Three op-amps, each wired to remember one bit, are chained so that every press of CLOCK moves each bit one place to the right. Whatever DATA says goes into the first place.

**Teaches:** latch, shift register, clocked logic, steering diodes

## What to do

Click **Sim**. Close DATA (switch_5) and press CLOCK (button_3) twice. Open DATA and press CLOCK three times. Close DATA, press once, open it again, and keep pressing.

## What you should see

- All three LEDs are dark at switch-on.
- Each press, the pattern of lit LEDs moves one place to the right, and the first LED takes the value of DATA: a single lit LED walks from left to right and drops off the end.
- A long press or a short one: always exactly one step.

## Why it works

Each op-amp holds its state because its output feeds back to its own + input. The clock edge pushes the shared − input up, which would clear every stage — but at the same instant each stage whose left neighbour was on gets a bigger push on its + input, through a capacitor and a diode that only pass it when the neighbour is high. The neighbour's value reaches the steering diode through a delay, so the stages that change during the edge cannot influence it: every bit moves exactly one place.
