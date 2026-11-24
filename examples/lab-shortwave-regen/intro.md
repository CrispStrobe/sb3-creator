# Short wave and mixing: hearing Morse with your own oscillator

The regenerative receiver again, but with a short-wave coil: the same tuning capacitor now reaches about 6 MHz. One station there is a Morse beacon — a bare carrier switched on and off, with no sound on it at all. An ordinary detector hears nothing but faint clicks. Let the receiver oscillate, and its own signal mixes with the beacon's carrier: their difference frequency is a tone you can hear, on for every dot and dash.

**Teaches:** short-wave tuning, mixing (sum and difference frequencies), heterodyne (beat-frequency) reception of Morse

## What to do

Click **Sim**. With the regeneration knob at 0.85 listen: nothing. Turn it to 0.75 and listen again, then wait for the key to lift.

## What you should see

- At 0.85 the receiver does not oscillate: the beacon's carrier reaches the transistor, but a constant carrier makes no sound.
- At 0.75 it oscillates; while the beacon's key is down the earphone plays a tone of a couple of kHz.
- When the key lifts, the tone dies away: the receiver still oscillates, but with nothing to mix with it is silent again.

## Why it works

The transistor's base junction is nonlinear: fed two signals at once, its current contains their sum and their difference. The sum (12 MHz) goes nowhere, but the difference between the receiver's own oscillation and the beacon's carrier — a few kHz — passes straight on to the earphone. Tune a little and the pitch changes, because the difference does. This is how every short-wave receiver hears Morse (with a "BFO", a beat-frequency oscillator) and, with a fixed difference, how a superheterodyne works. The antenna is coupled through only 20 pF: at 6 MHz a long wire hung on the coil loads the tuned circuit so heavily that no amount of feedback makes it oscillate.
