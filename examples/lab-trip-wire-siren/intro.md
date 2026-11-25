# Trip-wire alarm with a two-tone siren

A thin wire across a doorway: break it and a siren wails, and it keeps wailing even if the intruder puts the wire back. Only a hidden reset button silences it.

**Teaches:** latching flip-flop, diode isolation, modulated tone

## What to do

Click **Sim**. Open the switch (the wire breaks). Close it again. Then press the button (the hidden reset).

## What you should see

- Armed: green lit, silence.
- Wire broken: red lit and a siren that changes pitch about four times a second.
- Wire mended: the siren goes on. Reset: armed and quiet again.

## Why it works

Breaking the wire lets a resistor pull the set line up, and a diode passes that to the flip-flop, which flips and holds itself. Mending the wire pulls the set line down again, but the diode will not let it pull the flip-flop back. The second pair of transistors blinks slowly and, each time, tugs on the tone oscillator's capacitor: two pitches.
