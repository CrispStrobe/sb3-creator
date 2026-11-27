# lab-opamp-chirp — expected behaviour

## Circuit
- 9 V supply, one LM324 and one NPN (npn_22) as the pitch switch.
- Section 1: slow Schmitt-trigger astable (thresholds 3 V / 5.5 V). Its capacitor charges through 100 kΩ and is emptied through a 1N4148 (diode_8) and 4.7 kΩ: a sawtooth. SLOW (slide_switch_10) chooses 1 µF (polarized_cap_11, left: chick) or 10 µF (polarized_cap_12, right: crow). Green LED (led_28) on its output: lit while a chirp rises.
- Section 2: amplifies the sawtooth 2.7 times around the 4.5 V midpoint (47 kΩ / 22 kΩ to a 10 kΩ / 10 kΩ divider): a control voltage from about 0.4 V to 7 V.
- Sections 3 and 4: a voltage-controlled oscillator. Section 3 integrates (100 kΩ from the control voltage, 10 nF capacitor_21, + input at half the control voltage through two 100 kΩ); npn_22 pulls 47 kΩ from its − input to ground and reverses the ramp. Section 4 is a Schmitt trigger (3 V / 5.5 V) on the ramp that switches the transistor through 22 kΩ. The ramp's speed, and with it the pitch, is proportional to the control voltage: about 100 Hz per volt.
- Loudspeaker (speaker_31) on section 4 through 10 µF and 220 Ω.

## Observable behaviour
- As built (chick): about eleven chirps a second. Each one slides up from a low growl (about 150 Hz) to about 750 Hz in roughly 75 ms, then drops back within about 3 ms and starts again.
- SLOW (crow): the same slide, about ten times slower: a long rising call about once a second.
- The first chirp starts about 60 ms after switch-on, when the sawtooth capacitor has first charged to 3 V.

## Measured on the engine
bw-board r12 (`r12/engine-findings-20261125`), `test/lab-circuits-r10c.test.mjs`: first tone at 63.1 ms; slide ends at 137.7 ms, next one starts at 140.8 ms; 150 Hz in the first 10 ms of a chirp, 750 Hz in its last 10 ms, 62.5 Hz just after the drop; control voltage from 2 V to 4 V in 22.4 ms (chick) and 223 ms (crow).

## What this verifies
1. An op-amp integrator whose ramp current is set by a control voltage, plus a Schmitt trigger, is an oscillator whose pitch follows that voltage in proportion.
2. A sawtooth as the control voltage turns a steady tone into repeated chirps; the sawtooth's speed sets the character, from a chick's cheeping to a slow crow.

## Simulation notes
The crow setting is checked through the control voltage's climb rate, not by listening to a whole one-second slide: each tone cycle costs the solver a few hundred steps.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_3.1_pos V 5.408 +-0.03
net lm324_3.1_out V 7.224 +-0.03
net lm324_3.2_neg V 2.862 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **22 of this page's 42** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-chirp` prints them one by one.
<!-- engine-provenance -->
