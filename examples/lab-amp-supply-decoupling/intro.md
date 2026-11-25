# Howl and hum through the supply

At high gain an amplifier hears its own supply. With a run-down battery it starts to howl on its own; on an unsmoothed adaptor it hums. A resistor and a big capacitor in the right place cure both.

**Teaches:** supply impedance, feedback through the supply, hum, decoupling

## What to do

Click **Sim**. Listen with all three slide switches left. Slide WEAK (slide_switch_5) right: a weak battery. Then slide DECOUPLE (slide_switch_7) right. Put WEAK back, slide SUPPLY (slide_switch_4) right for the adaptor, and try DECOUPLE again.

## What you should see

- Fresh battery: silence.
- Weak battery: a loud howl of about 120 Hz; the voltage at the chip jumps up and down by several volts.
- Weak battery with DECOUPLE: silence again.
- Adaptor: a loud 100 Hz hum. Adaptor with DECOUPLE: only a faint hum.

## Why it works

The amplifier's input is fed from the same supply as its output stage. When the output pushes current into the speaker, a weak battery's voltage dips, the dip reaches the input, and the amplifier makes it 200 times bigger: the circuit drives itself. The adaptor's ripple takes the same path. DECOUPLE feeds the input through 10 kΩ with a 470 µF capacitor, which smooths away anything faster than a slow drift.
