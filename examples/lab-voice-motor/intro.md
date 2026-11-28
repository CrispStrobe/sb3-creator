# Sound starts the motor: amplifier chip, op-amp and PNP switch

Speak (or whistle) at the loudspeaker and a motor starts; a second after you stop, it switches off. The loudspeaker is the microphone, an LM386 amplifier chip and an op-amp share the work of amplifying it, and a PNP transistor switches the motor.

**Teaches:** microphone amplifier, splitting gain between two stages, envelope detection, comparator with hysteresis, PNP high-side switch

## What to do

Click **Sim** and wait half a second. Set the Sound slider of the loudspeaker (speaker_3) to 70 dB, then to 85 dB, then back to silence. Watch the RUN LED (led_24) and the motor (dc_motor_27). Then try THRESHOLD (potentiometer_21).

## What you should see

- At 70 dB nothing happens: the motor stands.
- At 85 dB RUN lights within a few milliseconds and the motor spins up.
- When the sound stops, the motor keeps running for about a second, then switches off and coasts to a stop.
- THRESHOLD higher: a louder sound is needed.

## Why it works

A loudspeaker used as a microphone gives only a fraction of a millivolt. The LM386 amplifies it 200 times, the first op-amp 45 times more. Two diodes pump the tone into the ENVELOPE capacitor, which a 1 MΩ resistor drains in about a second. The second op-amp compares the envelope with THRESHOLD: once it is higher, the op-amp's output falls to ground and draws current out of the PNP's base, through the RUN LED, and the PNP switches the motor on. When the op-amp's output is high, the LED blocks the base current, so the PNP stays off.
