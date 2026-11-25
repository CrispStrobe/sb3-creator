# Gated tones: pips and rattle

Two op-amp oscillators, one slow and one fast. The slow one switches the fast one on and off: pips like a chick's cheeping. Make the slow one ten times faster and the pips run together into a rattle.

**Teaches:** gating, oscillators, sound effects

## What to do

Click **Sim** and listen. Slide RATTLE (slide_switch_9) to the right, then back.

## What you should see

- Pips of a tone of about 640 Hz, about seven a second; the green LED (led_18) is lit in the pauses.
- RATTLE: a fast rattle, about 70 bursts a second.

## Why it works

While the slow oscillator's output is high, a diode holds the tone oscillator's capacitor above its upper threshold, and the tone cannot run. When the slow output goes low the diode lets go and the tone starts. RATTLE gives the slow oscillator a capacitor ten times smaller, so it switches ten times as often.
