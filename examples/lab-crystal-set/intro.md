# Crystal set: a radio without a battery

A long wire, a coil, a variable capacitor, a germanium diode and an earphone. That is all a radio needs to play a station, and it runs on nothing but the energy that arrives through the antenna.

**Teaches:** resonance and tuning, envelope detection, why a germanium diode, antenna and earth

## What to do

Click **Sim** and listen. Then turn the tuning knob slowly from top to bottom and stop wherever a station comes in.

## What you should see

- Knob about halfway: the strong local station, a steady 400 Hz tone.
- Knob about a quarter of the way up: a second station that alternates between two tones, 600 Hz and 900 Hz.
- Knob near the bottom: a faint 1 kHz tone from a distant station.
- Between the stations: silence.

## Why it works

Every station sends a fast carrier wave, hundreds of thousands of swings a second, and makes it stronger and weaker in time with the sound. The coil and the tuning capacitor form a resonant circuit that only builds up a large voltage for one carrier frequency: turning the knob changes the capacitance and so picks the station. The diode lets through only one half of each swing, and the small capacitor behind it smooths away the carrier itself. What remains rises and falls with the sound, and the earphone turns that into a tone. A germanium diode starts conducting at a much lower voltage than a silicon one, so even a weak station gets through.
