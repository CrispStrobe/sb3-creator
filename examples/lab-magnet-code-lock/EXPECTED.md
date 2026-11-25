# lab-magnet-code-lock — expected behaviour

## Circuit
- 9 V supply. A linear Hall sensor (`hall_analog_3`): half the supply without a field, higher near a north pole, lower near a south pole (the field slider).
- An LM324 (`lm324_4`) and a resistor chain (3.3 kΩ, 4.7 kΩ, 3.3 kΩ: 6.37 V and 2.63 V): amplifier 1 goes high for a north pass, amplifier 2 for a south pass.
- Each north pulse pushes a step of charge through 220 nF and two diodes into 1 µF (a staircase), which 2.2 MΩ slowly drains. A south pulse turns on an NPN (`npn_14`) that empties the 1 µF at once. Amplifier 3 says "open" when the staircase passes 2.63 V.
- A `cd4093` (`cd4093_15`): gate 1 inverts "open" and sets a latch made of gates 2 and 3; the LOCK button (`button_17`, 100 kΩ pull-up) resets it and, through a diode, empties the 1 µF as well, so the lock does not reopen on the count it was opened with. The latch lights a green LED through an NPN and, through another NPN, releases an LM386 (`lm386_25`, pins 1 and 8 joined) tone oscillator (1 MΩ / 1 MΩ, 220 kΩ, 56 nF) that plays on a piezo.

## Observable behaviour
- Two quick north passes: still locked (the staircase is at about 2.2 V).
- The third quick one: open, green LED and a tone of about 410 Hz, until LOCK is pressed.
- North, north, south, north: locked; the south pass emptied the count.
- Three slow passes (1.5 s apart): locked; the count leaks away between them.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, each pass 10 ms of field 0.8 (−0.8 for south) and 60 ms of rest.

| sequence | count after it | lock |
|---|---|---|
| N, N | about 2.2 V | locked |
| N, N, N (quick) | above 2.63 V | open |
| N, N, S | below 0.5 V | locked |
| N, N, N with 1.5 s gaps | leaked | locked |

## What this verifies
1. A diode pump counts pulses as steps on a capacitor; a leak resistor turns the count into "how many in the last few seconds".
2. A NAND latch keeps the lock open after the count has leaked away, until it is reset.

## Simulation notes
The code is fixed: three quick north passes with no south pass between them. A secret order of poles of any length would need a shift register.

```assert
# t = 1 ms, no field: Hall output at half supply, thresholds of the pass detectors
net hall_analog_3.ao V 4.50 +-0.01
net lm324_4.1_neg V 6.37 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-magnet-code-lock` prints them one by one.
<!-- engine-provenance -->
