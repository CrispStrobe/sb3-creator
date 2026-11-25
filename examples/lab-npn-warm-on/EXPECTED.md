# lab-npn-warm-on — expected behaviour

## Circuit
- 9 V battery. The NPN's base is held at the edge of conduction by 10 kΩ from +9 V against 680 Ω plus the SET rheostat (potentiometer_6).
- Red LED (led_8) with 1 kΩ from +9 V in its collector.
- The transistor (npn_3) sits in its own surroundings: its Temperature slider (ice, room, fingers, hot air), relaxing with a 1 s time constant.

## Observable behaviour
- Room temperature: about 0.19 mA, the LED is practically dark.
- Slider to 50 °C, then at 5 s about 1.2 mA; slider to hot air (70 °C), then at 5 s about 3.9 mA: the LED is clearly on.
- Back to room temperature: it goes out again.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: 0.188 mA at 25 °C; slider to 50 °C, then at 5 s 1.20 mA; to 70 °C, then at 5 s 3.88 mA; back to 25 °C, then at 6 s 0.197 mA.

## What this verifies
1. At a fixed base voltage a silicon transistor's collector current rises steeply with temperature (about two millivolts less VBE per kelvin): here twentyfold for 45 K.
2. Biasing right at the threshold makes the transistor a heat switch that turns ON when warmed.

## Simulation notes
The transistor uses the Shockley junction model, where VBE falls about two millivolts per kelvin at constant current; its surroundings (surroundC) relax into it with thermalTau = 1 s so scenarios stay short. SET moves the base voltage and with it the switching temperature.

```assert
# 1 ms after switch-on, room temperature, SET as built
net npn_3.base V 0.611 +-0.01
net resistor_7.b V 8.81 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-warm-on` prints them one by one.
<!-- engine-provenance -->
