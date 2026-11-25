# Morse over an infrared beam

Send Morse code without wires: the key starts a tone, the tone flashes an infrared LED, and across the room a phototransistor turns the flashes back into sound.

**Teaches:** optical link, keying, phototransistor receiver

## What to do

Click **Sim**. Press the button (the Morse key) in short and long bursts and listen at the earphone. Turn the light path's **knob** to move the receiver further away.

## What you should see

- A tone in the earphone exactly while the key is down.
- Further away it gets quieter.

## Why it works

The amplifier chip oscillates only while the key releases it; each time its output goes high the IR LED lights. The phototransistor passes current in step with the light, the transistor amplifies that, and the earphone hears the same rhythm and pitch.
