# Metronome, engine and siren

One tone generator, three capacitors. With the big one it ticks like a metronome, with the middle one it putters like an engine, with the small one it whistles — and the knob speeds each of them up or slows it down.

**Teaches:** RC oscillator, period and capacitance, frequency range

## What to do

Click **Sim**. The TICK switch (switch_12) is closed: listen to the ticks and watch the red LED, then turn the knob (potentiometer_8). Open TICK and close ENGINE (switch_10): turn the knob up like a throttle. Open ENGINE as well and sweep the knob back and forth for a siren.

## What you should see

- TICK: the LED changes every 1.2–1.7 s with the knob down, about every 0.2 s with it up; the speaker ticks at each change.
- ENGINE: a putter of about 15 beats a second that rises to a buzz of about 120 when you turn up.
- Neither: a tone from about 340 Hz to about 2.7 kHz.

## Why it works

The amplifier flips its output each time the capacitor on its − input has charged or discharged past a threshold. The time that takes is proportional to the capacitance and to the resistance it charges through: a capacitor a thousand times bigger makes it a thousand times slower, and the knob changes the resistance.
