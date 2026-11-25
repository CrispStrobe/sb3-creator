# Moisture alarm with light and tone

Two bare wires lie in a nappy. While it is dry nothing happens; once it gets wet, a blue light comes on and a beeper sounds. A few transistors do it.

**Teaches:** transistor switch, inverter, gating an oscillator, conductivity of water

## What to do

Click **Sim**. Turn the **WET** knob up slowly (the probe gets wetter) and back.

## What you should see

- Dry: dark and silent.
- Wet: the blue LED lights and a tone of about 785 Hz sounds.

## Why it works

Water with a little salt in it conducts. Once the probe is wet, current flows through it into the first transistor's base and switches it on: the blue LED lights. The same transistor takes the base current away from a second one, which until then held the tone generator's base resistors at ground. Released, the tone generator starts.
