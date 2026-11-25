# Electronic coin toss

Hold the button and an LM386 oscillator flickers between red and green faster than you can see. Let go and it stops dead, on red or on green. Which one depends on the exact instant you release, which you cannot control: heads or tails.

**Teaches:** hysteresis, oscillator versus memory (bistable), a transistor inverter

## What to do

Click **Sim**. Hold the button for a moment, then release it. Repeat a few times and count red and green.

## What you should see

- At rest: green.
- While held: both LEDs seem to glow (they flicker about 170 times a second).
- After release: one LED stays lit, red or green, until the next toss.

## Why it works

The amplifier switches with hysteresis: it flips up only above one voltage and down only below a lower one. With the button released, its minus input sits halfway between, so whatever state it is in, it stays: a memory. Pressing the button connects a capacitor that is charged and discharged by the output itself, so the minus input swings across both levels and the circuit oscillates. The transistor turns the green LED off whenever the output is high, so exactly one LED is lit.
