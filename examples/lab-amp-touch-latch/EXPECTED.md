# lab-amp-touch-latch — expected behaviour

## Circuit
- 9 V supply. An LM386 whose − input is held at a fixed reference by 100 kΩ from +9 V (against the chip's internal input resistance). Its output lights a red LED through 1 kΩ.
- A slide switch closes the loop from the output to the + input: left through 47 kΩ (a latch), right through a 4.7 µF electrolytic (a monoflop). A diode from ground to the + input stops it going far below ground.
- SET is a Darlington touch sensor: a fingertip (2.2 MΩ of skin) turns two NPN on, and their emitter lifts the + input through 1 kΩ. RESET grounds the + input.

## Observable behaviour
- Latch: at switch-on the output is low (+ input 0.46 V, below the 3 V on the − input). A touch sends it high, and after the finger is gone the 47 kΩ holds the + input above the reference: the LED stays on until RESET.
- Monoflop: a touch sends the output high; the step through the 4.7 µF leaks away through the input's 50 kΩ, and about a quarter of a second later the output falls back by itself.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: − input 3.00 V; switch-on + input 0.46 V, output 0.90 V; touched output 8.10 V; released + input held at 4.17 V, LED 6.39 mA, still set 350 ms later; RESET output 0.90 V. Monoflop: output back below 4.5 V 260 ms after a 20 ms touch, + input then −0.44 V (diode clamp).

## What this verifies
1. Positive feedback through a resistor makes an amplifier bistable (set/reset flip-flop).
2. Positive feedback through a capacitor makes it monostable.

## Simulation notes
Measured headless on the committed circuit; `test/lab-circuits-r6c.test.mjs` replays the learner's controls.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm386_8.inn V 3.00 +-0.01
net lm386_8.inp V 0.46 +-0.02
net lm386_8.vout V 0.90 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-touch-latch` prints them one by one.
<!-- engine-provenance -->
