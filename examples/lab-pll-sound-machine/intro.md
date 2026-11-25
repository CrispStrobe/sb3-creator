# Sound machine: the PLL oscillator warbles and wails

A toy sound machine: a slow oscillator wiggles the control voltage of a PLL chip's oscillator. Choose a square wave and the tone jumps between two notes; choose a triangle and it glides like a siren.

**Teaches:** frequency modulation, the integrator, voltage-controlled oscillators

## What to do

Click **Sim** and listen to the piezo. Close the modulation switch. Then move the slide switch from square to triangle. Turn the pitch potentiometer to move the whole sound up or down.

## What you should see

- Switch open: one steady tone.
- Square: a fast warble between about 500 and 790 Hz.
- Triangle: a siren gliding between about 470 and 710 Hz.

## Why it works

The VCO's pitch follows its control voltage. The LM386 oscillator makes a square wave that jumps between two voltages, so the pitch jumps between two notes. The op-amp integrator turns the square into a triangle: it rises steadily while the square is high and falls while it is low, so the pitch rises and falls smoothly. Synthesisers make their sounds the same way.
