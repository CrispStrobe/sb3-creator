# Key finder with threshold LEDs

Whistle and the key ring answers. A loudspeaker as microphone, op-amp gain stages and an op-amp latch: one loud enough whistle turns the alarm on, and only RESET turns it off. Two more LEDs show, all the time, whether the sound is above or below the threshold, so you can set it by eye.

**Teaches:** gain chain, peak detection, latch, comparator as indicator, sensitivity

## What to do

Click **Sim**. Raise the sound at the loudspeaker (speaker_3) to 80 dB, then to 90 dB, and back to 0. Wait a second or two, then press RESET (button_23). Slide SENSITIVE (slide_switch_17) to the right and try 60 dB and 70 dB. Finally turn THRESHOLD (potentiometer_20) down to 0.4 in silence.

## What you should see

- Silence: the green UNDER LED (led_34) is lit.
- 80 dB: still UNDER. 90 dB: the red OVER LED (led_32) and the ALARM LED (led_26) light. When the whistle stops, OVER goes out again after a moment and UNDER comes back, but the ALARM stays on.
- RESET puts the ALARM out.
- SENSITIVE: already 70 dB turns OVER and the ALARM on.
- THRESHOLD at 0.4: OVER lights without any sound and the alarm trips by itself. Turn it back up until UNDER is lit again: that is the most sensitive safe setting.

## Why it works

The amplifier stages multiply the loudspeaker's tiny voltage. Its peaks charge the latch's input through a diode; once that passes the threshold the latch's output goes high and holds itself there. A second diode charges a small capacitor, the sound level, which a second op-amp compares with the same threshold both ways: one output lights OVER, the other UNDER. The difference between level and threshold is often only a few tenths of a volt, far too little to light an LED directly; the comparators turn it into a full on or off.
