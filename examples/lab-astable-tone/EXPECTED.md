# lab-astable-tone — expected behaviour

## Circuit
A two-transistor astable on 9 V, fed through a Morse key (a push button between the battery and the whole
oscillator). Collector resistors 1 kΩ; a yellow LED in series with Q1's, a piezo earpiece across Q2's.
Base resistors 47 kΩ (Q1) and 56 kΩ (Q2). Two slide switches choose the coupling capacitors: 10 nF each
(position 0, tone) or 4.7 µF electrolytics (position 1, metronome).

## Observable behaviour
- Key up: the oscillator has no supply; every node sits at 0 V and nothing sounds.
- Key down with the 10 nF capacitors: a steady tone of about 1470 Hz in the earpiece. The yellow LED switches
  on and off at the same rate, far too fast to see, so it simply looks lit.
- Key up again: the tone stops at once. Tapping the key gives Morse code.
- Both switches to the 4.7 µF electrolytics: the same circuit now ticks about three times a second (one cycle
  about 0.32 s). Each switching is a single click, and the LED visibly blinks: a metronome.

## What this verifies
1. Sound is change: the earpiece only responds while the voltage across it keeps switching.
2. The same circuit covers clicks and tones; only R · C decides how often it switches.

```assert
# key up at t = 1 ms: the oscillator is unpowered
net vsource_2.pos V 9.00 +-0.01
net npn_5.collector V 0.00 +-0.01
net npn_4.collector V 0.00 +-0.01
```
