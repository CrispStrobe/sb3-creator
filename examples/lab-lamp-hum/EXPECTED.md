# lab-lamp-hum — expected behaviour

## Circuit
- 9 V supply. The "mains lamp" is a white LED (`led_12`) with 220 Ω fed from a 50 Hz sine source (`function_gen_3`, 8 V amplitude) through a bridge of four diodes, so it gets every half wave. A slide switch (`slide_switch_9`) feeds the same LED from the battery through 220 Ω more instead: the torch.
- A light guide (`light_path_24`, fibre, 1 m, shielded from room light) carries its light to a phototransistor (`phototransistor_13`) with 4.7 kΩ on its emitter.
- 1 µF couples that to an NPN stage (`npn_17`: 680 kΩ from collector to base, 4.7 kΩ load). 1 µF and 100 kΩ couple the stage into an LM386 (`lm386_21`, gain 20, 1 µF on BYPASS), and 220 µF couples the LM386 to the speaker.

## Observable behaviour
- Mains position: a loud hum at 100 Hz, twice the mains frequency.
- Torch position: silence, although the LED is lit.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| source | hum | LM386 output swing |
|---|---|---|
| mains (50 Hz, bridge) | 99.7 Hz | 7.04 V |
| torch (battery) | — | 0.000002 V |

## What this verifies
1. A lamp on alternating current flickers twice per mains cycle: the current passes zero 100 times a second.
2. Coupling capacitors pass only changes: the torch's steady light gives a steady phototransistor current, which never reaches the amplifier.

## Simulation notes
An LED behind a bridge flickers fully; a filament lamp would flicker less deeply (its wire stays hot), which would make the hum quieter but not change its pitch. The function generator's return lead is tied to ground through 1 MΩ so the bridge has a reference.

```assert
# t = 1 ms: the 50 Hz source 18 degrees into its first cycle, under the bridge's load
net function_gen_3.out V 2.42 +-0.05
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-lamp-hum` prints them one by one.
<!-- engine-provenance -->
