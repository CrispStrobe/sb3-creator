# lab-monoflop-diode-edge — expected behaviour

## Circuit
- 9 V battery. Q2 conducts at rest (100 kΩ into its base; green LED led_8 with 1 kΩ). Q1 is off (red LED led_6 with 1 kΩ); 22 kΩ from Q2's collector and 47 kΩ to ground set its base.
- Timing: 10 µF from Q1's collector to the 100 kΩ node, which reaches Q2's base through a diode bridged by the DIODE switch (switch_12, closed = diode bypassed, as built).
- Trigger: the button (button_15) from +9 V to the TRIGGER slide switch (slide_switch_16): left (as built) on through 10 kΩ straight to Q1's base; right through 100 nF (100 kΩ to ground behind it).

## Observable behaviour
- At rest: green on, red off.
- TRIGGER left, a short press: red for about 0.68 s. Held for 1.5 s: red stays on while the button is held.
- TRIGGER right: about 0.68 s of red however long the button is held.
- Open DIODE: the pulse grows to about 0.74 s.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: direct 680 ms (short press) and 1540 ms (held 1.5 s); edge 680 ms either way; edge with the diode 740 ms.

## What this verifies
1. The pulse is the time the 10 µF needs to recharge through 100 kΩ until Q2 conducts again: RC·ln(2) ≈ 0.7 s.
2. A direct trigger keeps Q1 on for as long as it is applied; a capacitor-coupled trigger delivers only the moment of pressing, so the pulse length is fixed.
3. A diode in Q2's base adds one diode drop to the voltage the capacitor must reach: a slightly longer pulse.

## Simulation notes
When Q1 switches on, the capacitor drives Q2's base about 7 V below ground; the diode also keeps that reverse voltage off Q2's base-emitter junction (a real junction breaks down at a few volts reverse; the model does not show that breakdown).

```assert
# 1 ms after switch-on: Q2 conducting, Q1 off
net npn_4.collector V 0.03 +-0.02
net npn_4.base V 0.76 +-0.03
net resistor_14.a V 0.02 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-monoflop-diode-edge` prints them one by one.
<!-- engine-provenance -->
