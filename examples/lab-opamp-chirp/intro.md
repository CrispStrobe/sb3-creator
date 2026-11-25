# Op-amp chirp: chick to crow

A tone whose pitch slides up, again and again: a chirp. A slow sawtooth sets the pitch of a voltage-controlled oscillator built from op-amps. Fast sawteeth give a chick's cheeping, slow ones a long rising crow.

**Teaches:** voltage-controlled oscillator, sawtooth, sound effects

## What to do

Click **Sim** and listen. Then slide SLOW (slide_switch_10) to the right, and back.

## What you should see

- About eleven chirps a second, each sliding up from a low growl to about 750 Hz and dropping back at once; the green LED (led_28) lights while a chirp rises.
- SLOW: one long rising call about once a second.

## Why it works

The first op-amp makes a sawtooth: its capacitor charges slowly and is emptied quickly through a diode. The second amplifies it into a control voltage that sweeps from almost zero to 7 V. The last two op-amps and a transistor form an oscillator whose capacitor is charged and discharged by currents proportional to that control voltage: twice the voltage, twice the pitch. SLOW gives the sawtooth a ten times larger capacitor.
