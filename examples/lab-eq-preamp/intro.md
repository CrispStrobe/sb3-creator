# Preamplifier with equalising feedback

A record player's pickup gives too much treble and too little bass. The cure is an amplifier whose feedback depends on frequency: it lets the bass through at full gain and turns the treble down.

**Teaches:** multistage amplifier, frequency-dependent feedback, equalisation

## What to do

Click **Sim**. Set the **function generator** to 100 Hz and then to 3000 Hz, each time with the **EQ** switch closed and open, and watch the output on the scope or listen.

## What you should see

- At 100 Hz the EQ makes hardly any difference.
- At 3 kHz the EQ makes the output several times smaller.

## Why it works

The amplifier chip's gain is set by an internal resistor from its output back to pin 1. The EQ network adds a resistor in parallel — but through a capacitor, which only conducts for high frequencies. More feedback means less gain, so only the treble is turned down.
