# Two-tone horn: a slow op-amp switches the pitch

Fire engines and ambulances use two alternating tones. Here a slow op-amp oscillator switches a transistor tone generator between two pitches, about a major third apart.

**Teaches:** multivibrator, controlling a pitch with a voltage, oscillators working together

## What to do

Click **Sim** and listen. Switch **SOUND** off and on.

## What you should see

- Two tones take turns, a high one and a lower one, a few times a second.

## Why it works

The slow op-amp oscillator's output jumps between high and low. Through a divider and a follower that becomes one of two voltages, about 7.1 V or 4.2 V, which feed the base resistors of the tone generator. The higher the voltage, the faster the multivibrator's capacitors recover, and the higher the tone.
