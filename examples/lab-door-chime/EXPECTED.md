# lab-door-chime — expected behaviour

## Circuit
- 9 V supply. LM386 (lm386_3) relaxation oscillator: 47 kΩ from the output and 100 kΩ from +9 V set the + input's moving threshold (1 nF speed-up); 10 kΩ and 220 nF on the − input set the pitch. Loudspeaker through 47 µF and 47 Ω.
- Monoflop from two NPNs: Q2 (npn_18) held on by 100 kΩ (resistor_17) from +9 V; its collector (4.7 kΩ) feeds Q1's base (npn_14) through 47 kΩ, with 47 kΩ from that base to ground. Q1's collector (4.7 kΩ) reaches Q2's base through 4.7 µF (polarized_cap_16).
- DOOR (button_12) lifts Q1's base through 10 kΩ.
- Kill NPN (npn_23) from the oscillator's + input to ground, its base on Q1's collector through 47 kΩ.

## Observable behaviour
- At rest Q1 is off (collector about 5.5 V), the kill NPN is on and holds the + input near 0 V: silent.
- A press turns Q1 on; its collector falls to about 0.1 V and drags Q2's base to about −4.9 V through the 4.7 µF. Q2 turns off and its collector holds Q1 on. The kill NPN lets go and the chime sounds (about 280 Hz, 7.2 V peak to peak).
- After about 0.31 s Q2's base has recharged through 100 kΩ, Q2 turns back on, Q1 off, and the chime stops — the same length for a short tap as for a longer press, as long as the button is released before the chime ends.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10d.test.mjs`: rest Q1 collector 5.454 V, + input 0.029 V; 5 ms after a press Q1 collector 0.075 V, Q2 base −4.915 V, output 7.178 V pp; pulse length 310 ms from the press (timed with the tone generator's pull-up lifted to 1 GΩ so that it stays silent; the pulse is the monoflop's alone).

## What this verifies
1. A monoflop gives one pulse of fixed length per trigger: about 0.69 × 100 kΩ × 4.7 µF = 0.32 s by the rule of thumb, 0.31 s measured.
2. The pulse gates a tone generator through one transistor that holds the generator's input low at rest.

## Simulation notes
Every flip of the LM386 oscillator costs the solver many steps, so the scenario listens to the chime for a few milliseconds and times the monoflop with the tone generator disabled.

```assert
# 1 ms after switch-on: monoflop settling into its rest state, oscillator held off
net npn_18.base V 0.717 +-0.03
net npn_23.base V 0.678 +-0.03
net lm386_3.vout V 0.899 +-0.02
```
