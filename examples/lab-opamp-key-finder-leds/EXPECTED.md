# lab-opamp-key-finder-leds — expected behaviour

## Circuit
- 9 V supply; a midpoint at half the supply (10 kΩ / 10 kΩ, 1 µF) for the + inputs of the gain stages.
- The loudspeaker (speaker_3) is the microphone. LM324 (lm324_4) section 1: ×100 (1 kΩ in through 4.7 µF, 100 kΩ back); section 2: ×30 (3.3 kΩ in, 100 kΩ back); SENSITIVE (slide_switch_17, right) adds section 3, ×10.
- Section 4: the latch. The signal's positive peaks reach its + input through a 1N4148 (1 MΩ to ground); THRESHOLD (potentiometer_20, as built at 0.55: 4.95 V) sets its − input. Once over, its output holds the + input high through a diode and 47 kΩ. RESET (button_23) pulls the + input to ground through 1 kΩ. Red ALARM LED (led_26) on the output.
- The threshold LEDs: a second 1N4148 charges 470 nF (capacitor_28, 1 MΩ across it) from the same signal: the sound level. A second LM324 (lm324_30) compares it with the THRESHOLD wiper: section 1 lights the red OVER LED (led_32) when the level is above, section 2 the green UNDER LED (led_34) when below, each through 1 kΩ. Sections 3 and 4 are parked.

## Observable behaviour
- Quiet: level 4.17 V, under the 4.95 V threshold: UNDER lit, OVER and ALARM dark.
- Normal: an 80 dB whistle lifts the level to 4.48 V: UNDER stays lit, no alarm.
- 90 dB: level 5.34 V: OVER lights and the ALARM latches. When the whistle stops the level drains back (UNDER again within 1.5 s) but the ALARM stays on.
- RESET clears it.
- SENSITIVE: 60 dB leaves UNDER lit, 70 dB turns OVER on and latches the alarm: twenty decibels more sensitive, the factor of ten of the extra stage.
- THRESHOLD turned down to 0.4 (3.6 V), below the quiet level: OVER lights in silence and the alarm trips by itself. Setting THRESHOLD means staying just above that point.

## Measured on the engine
bw-board de8083c5, `test/lab-circuits-thresholds.test.mjs`: a lit threshold LED's op-amp output 7.236 V, a dark one 0.005 V; level 4.166 V quiet, 4.48 V at 80 dB, 5.339 V at 90 dB, 4.162 V after 1.5 s of silence; SENSITIVE 4.481 V at 60 dB, 5.353 V at 70 dB.

## What this verifies
1. AC-coupled gain stages lift a loudspeaker's microvolts to volts; ten times more gain is 20 dB more sensitivity.
2. Positive feedback through a diode makes a comparator latch, and only a reset releases it.
3. Comparators turn a fraction-of-a-volt difference between level and threshold into a full LED drive, which a bare LED across the two could never show.

## Simulation notes
The whistle is a steady 2 kHz tone at the loudspeaker (its sound slider in dB SPL).

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_4.4_neg V 4.949 +-0.01
net lm324_4.4_out V 0.005 +-0.01
net lm324_30.1_out V 0.005 +-0.01
net lm324_30.2_out V 7.236 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 32** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-key-finder-leds` prints them one by one.
<!-- engine-provenance -->
