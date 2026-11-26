# lab-opamp-key-finder — expected behaviour

## Circuit
- 9 V supply; a midpoint at half the supply (10 kΩ / 10 kΩ, 1 µF) for the + inputs of the gain stages.
- The loudspeaker (speaker_3) is the microphone. LM324 section 1: ×100 (1 kΩ in through 4.7 µF, 100 kΩ back); section 2: ×30 (3.3 kΩ in, 100 kΩ back); SENSITIVE (slide_switch_17, right) adds section 3, ×10.
- Section 4: the latch. The signal's positive peaks reach its + input through a 1N4148 (1 MΩ to ground); THRESHOLD (potentiometer_20, as built at 0.55: 4.95 V) sets its − input. Once over, its output holds the + input high through a diode and 47 kΩ. RESET (button_24) pulls the + input to ground through 1 kΩ. Red ALARM LED (led_27) on the output. voltmeter_21 reads + input minus threshold.

## Observable behaviour
- Quiet: the meter reads about −0.8 V (the peak line sits below the threshold); alarm off.
- Normal: an 80 dB whistle at the loudspeaker does not trip it; 90 dB does. The alarm stays on after the whistle stops.
- RESET clears it.
- SENSITIVE: 60 dB does not trip it, 70 dB does: twenty decibels more sensitive, the factor of ten of the extra stage.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: alarm output 7.2 V on, 0.005 V off; normal: 80 dB off, 90 dB latched; SENSITIVE: 60 dB off, 70 dB latched.

## What this verifies
1. AC-coupled gain stages lift a loudspeaker's microvolts to volts; ten times more gain is 20 dB more sensitivity.
2. Positive feedback through a diode makes a comparator latch, and only a reset releases it.

## Simulation notes
The whistle is a steady 2 kHz tone at the loudspeaker (its sound slider in dB SPL).

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_4.4_neg V 4.949 +-0.01
net lm324_4.4_out V 0.005 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 17** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-key-finder` prints them one by one.
<!-- engine-provenance -->
