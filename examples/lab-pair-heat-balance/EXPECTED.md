# lab-pair-heat-balance — expected behaviour

## Circuit
- 9 V battery. Two NPNs (npn_5, npn_6) with their emitters joined over one 470 Ω resistor to ground (the tail).
- Both bases on the same divider (4.7 kΩ / 2.2 kΩ, 2.8 V).
- A red LED (led_9) with 470 Ω in the first collector, a green LED (led_11) with 470 Ω in the second.
- Each transistor has its own surroundings: its own Temperature slider (1 s time constant).

## Observable behaviour
- Both at room temperature: they share the tail current equally, about 2.3 mA each.
- Heat the first, then at 5 s the red LED takes almost all of it (4.6 mA) and the green one has nearly gone out (0.12 mA).
- Heat both alike: they share again; the total has barely moved.
- Heat only the second: now green takes it all.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: room 2.27 / 2.27 mA; first to 70 °C, then at 5 s 4.58 / 0.118 mA; second to 70 °C as well, then at 5 s 2.43 / 2.30 mA; first back to 25 °C, then at 5 s 0.121 / 4.58 mA.

## What this verifies
1. The pair compares the two base-emitter voltages: a 45 K difference (about 90 mV) is enough to swing the whole tail current to one side.
2. A temperature change common to both moves neither LED: the pair cancels its own drift, which is why matched pairs are used at the inputs of amplifiers.

## Simulation notes
Both transistors use the Shockley junction model with their own `surroundC` (the Temperature slider) and thermalTau = 1 s. The slight inequality of the LEDs (red and green forward voltages differ) shows in the "both hot" share.

```assert
# 1 ms after switch-on, both at room temperature: equal shares
net npn_5.base V 2.82 +-0.03
net npn_5.emitter V 2.15 +-0.03
net resistor_8.b V 7.93 +-0.05
net resistor_10.b V 7.93 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pair-heat-balance` prints them one by one.
<!-- engine-provenance -->
