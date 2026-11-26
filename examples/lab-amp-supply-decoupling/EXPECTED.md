# lab-amp-supply-decoupling — expected behaviour

## Circuit
- LM386 (lm386_13) at gain 200 (10 µF across pins 1 and 8), 1 µF on the bypass pin, + input grounded. Loudspeaker through 220 µF.
- Its input is fed from its own supply: 100 kΩ (resistor_10) and 4.7 kΩ (resistor_11) divide the supply, and 1 µF (polarized_cap_12) carries that node to the − input, the way a microphone's feed would.
- SUPPLY (slide_switch_4): left the 9 V battery; right an unsmoothed adaptor, the battery plus 0.5 V of 100 Hz ripple (function_gen_3 in series, its output resistance `rOut` set to one ohm: a stiff adaptor).
- WEAK (slide_switch_5): right puts 47 Ω (resistor_6) in series, a run-down battery's internal resistance.
- DECOUPLE (slide_switch_7): right feeds the divider through 10 kΩ (resistor_8) with 470 µF (polarized_cap_9) to ground.

## Observable behaviour
- Fresh battery, no decoupling: quiet. The supply stays at 9.0 V.
- WEAK: the amplifier howls by itself, about 120 Hz, the output swinging between 0.9 V and 3.5 V while the supply at the chip dips from 8.8 V to 3.7 V.
- WEAK + DECOUPLE: quiet again (under 0.03 V peak to peak at the output); the supply sits steady at 8.75 V.
- ADAPTOR: a loud 100 Hz hum, the output swinging over more than 6 V, with a rasp on each rise.
- ADAPTOR + DECOUPLE: the hum drops to about 0.12 V peak to peak; its period is 10 ms (100 Hz).

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10d.test.mjs`, 60 ms after switch-on, over the following 40–60 ms: fresh 0 crossings, supply 8.999 V; WEAK period 8.18 ms, output 0.903–3.461 V, supply 3.653–8.759 V; WEAK + DECOUPLE output 0.025 V pp, supply 8.752 V; ADAPTOR output 0.911–7.405 V; ADAPTOR + DECOUPLE output 0.116 V pp, period 10.0 ms.

## What this verifies
1. Supply impedance is a path from the output back to the input: the output current drops the supply, the supply feeds the input, and at gain 200 that loop oscillates.
2. An RC filter in the input's supply feed (10 kΩ, 470 µF: a corner near 0.03 Hz) breaks the loop and removes the adaptor's 100 Hz ripple: decoupling.

## Simulation notes
The input is fed into the − input, so the loop through the supply is positive feedback at all frequencies the coupling capacitors pass; with the signal on the + input instead it would be negative feedback and only the hum would show. With a larger bypass capacitor the loop is slower and the howl turns into slow motor-boating (about 14 Hz with 10 µF), but its start-up then takes several hundred milliseconds to simulate. The adaptor alone also carries a fast parasitic burst on each rising half of the hum: the 1 Ω adaptor is itself a small supply impedance.

```assert
# 1 ms after switch-on (fresh battery): supply at 9 V, bias feed still charging the input capacitor
net lm386_13.vs V 8.986 +-0.03
net lm386_13.vout V 0.884 +-0.03
net resistor_10.b V 0.371 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 43** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-supply-decoupling` prints them one by one.
<!-- engine-provenance -->
