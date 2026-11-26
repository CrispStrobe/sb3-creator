# lab-optical-astable — expected behaviour

## Circuit
- 9 V supply. Q1 (NPN, green LED and 1 kΩ in its collector) is the ordinary half of an astable: 100 kΩ from +9 V to its base, 10 µF from the phototransistor's collector to that base.
- The other half is a phototransistor (47 kΩ to +9 V). Its 'base drive' is the light of an IR LED 2 cm away (with a red LED in series so you can see it), fed through 4.7 kΩ from +9 V and coupled to Q1's collector through 47 µF.

## Observable behaviour
- Q1 turns on: its collector falls and drags the LED node far below ground — dark; the phototransistor lets go.
- When 4.7 kΩ has recharged the 47 µF the LEDs light again, the phototransistor pulls its collector down, the 10 µF kicks Q1 off, and Q1 waits for 100 kΩ to recharge its base.
- Green (Q1) and red (the light) take turns, each for about 0.17–0.2 s.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs` (Q1's collector sampled every 5 ms for 1.5 s): Q1 on at 71, 406, 776, 1161 ms and off at 231, 586, 961, 1341 ms — green for 160–185 ms, then the light for 175–200 ms; LED current 1.36 mA while lit; the phototransistor's collector reaches 3.2 V while dark.

## What this verifies
1. An optocoupler is an LED and a phototransistor sharing light.
2. A cross-coupling in an astable can be made of light.

## Simulation notes
Measured headless on the committed circuit; `test/lab-circuits-r6c.test.mjs` replays the learner's controls.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_5.collector V 2.88 +-0.1
net phototransistor_13.collector V 0.035 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-optical-astable` prints them one by one.
<!-- engine-provenance -->
