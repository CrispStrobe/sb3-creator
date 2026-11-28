# lab-torch-toggle — expected behaviour

## Circuit
- 9 V battery. Two NPNs cross-coupled through 22 kΩ: red LED (led_6) with 1 kΩ on the first, green LED (led_8) with 1 kΩ on the second.
- A phototransistor (phototransistor_11, emitter 10 kΩ to ground) drives a switching NPN through 10 kΩ; its collector, with 4.7 kΩ from +9 V, is the trigger line.
- The trigger line reaches each base through 10 nF and a steering diode; each diode's other end follows its own transistor's collector through 47 kΩ. 10 nF on the first base makes it wake up green.

## Observable behaviour
- As built: green on, red off.
- Light on the phototransistor (a torch): the flip-flop changes over, and stays so when the light goes.
- Each further flash changes it again. A weak torch (light 0.05) is enough; a glimmer (0.01) is not.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: built: red 0.30 mA, green 6.89 mA; flash 1 → red 7.18 mA, green 0.28 mA (held in the dark); flash 2 → green; flash 3 → red; light 0.05 toggles, 0.01 does not.

## What this verifies
1. Only the falling edge of the trigger line acts: the steering diodes pass it to the transistor that is conducting, which turns off.
2. The cross-coupling then holds the new state: one flash, one change, however long the light stays.

## Simulation notes
The "off" LED still carries about 0.3 mA (it feeds the other base through 22 kΩ); it glows faintly. The trigger line falls when the light switches the NPN on; when the light goes it rises and the diodes block.

```assert
# 1 ms after switch-on: green side conducting, trigger line high (dark)
net npn_3.collector V 7.21 +-0.05
net npn_4.collector V 0.09 +-0.03
net resistor_15.b V 8.85 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 17** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-torch-toggle` prints them one by one.
<!-- engine-provenance -->
