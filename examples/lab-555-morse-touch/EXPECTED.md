# lab-555-morse-touch — expected behaviour

## Circuit
- 9 V supply. 555 astable (timer_555_3): 1 kΩ, 10 kΩ, 100 nF (about 680 Hz) on a piezo (piezo_8). Reset pin held low by 10 kΩ (resistor_9).
- KEY (button_10) lifts the reset pin to +9 V.
- TOUCH (button_11) is a fingertip from +9 V through the skin, chosen by slide_switch_12: moist 1 MΩ (left) or dry 100 MΩ (right), into an NPN's base (npn_15). The NPN pulls a PNP's base (pnp_17; 10 kΩ to +9 V); the PNP's collector lifts the reset pin.

## Observable behaviour
- Idle: reset 0 V, silent.
- KEY held: reset 9 V, a 679 Hz tone; released: silent again.
- TOUCH with a moist fingertip: reset 8.97 V, the same tone.
- TOUCH with a dry fingertip: reset 0 V, silent.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: 679.3 Hz with KEY and with the moist finger, 0 Hz idle and with the dry finger.

## What this verifies
1. The 555's reset pin is an enable input: the oscillator runs only while it is high.
2. The NPN–PNP pair multiplies the skin current by about 10⁴: 8 µA through a moist fingertip saturates the PNP, 80 nA through a dry one leaves it off.

## Simulation notes
Skin resistance is a fixed resistor per position of the slide switch; a real fingertip varies with pressure and moisture between these values.

```assert
# switched on, no key: reset low, PNP base pulled up, silent
net timer_555_3.reset V 0 +-0.01
net npn_15.collector V 9.0 +-0.01
net timer_555_3.output V 0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 21** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-morse-touch` prints them one by one.
<!-- engine-provenance -->
