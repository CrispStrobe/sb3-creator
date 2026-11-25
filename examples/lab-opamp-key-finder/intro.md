# Key finder: a whistle latches the alarm

Whistle and the key ring answers. A loudspeaker as microphone, op-amp gain stages and an op-amp latch: one loud enough whistle turns the alarm on, and only the RESET button turns it off again.

**Teaches:** gain chain, peak detection, latch, sensitivity

## What to do

Click **Sim**. Raise the sound at the loudspeaker (speaker_3) to 80 dB, then to 90 dB, and back to 0. Press RESET (button_24). Slide SENSITIVE (slide_switch_17) to the right and try 60 dB and 70 dB. Turn THRESHOLD (potentiometer_20) and watch voltmeter_21 to see how much margin you have.

## What you should see

- Normal: 80 dB leaves the ALARM LED (led_27) dark, 90 dB lights it, and it stays lit in silence.
- RESET puts it out.
- SENSITIVE: already 70 dB lights it.

## Why it works

Two (or three) amplifier stages multiply the loudspeaker's tiny voltage. Its peaks charge the latch's input through a diode; once that passes the threshold the output goes high and feeds itself back to the same input, so it no longer needs the sound. RESET pulls that input down and breaks the loop.
