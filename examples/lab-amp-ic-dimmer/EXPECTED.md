# lab-amp-ic-dimmer — expected behaviour

## Circuit
- 9 V battery, one LM386 power amplifier across the breadboard gutter. Pins 1 and 8 (gain) and pin 7 (bypass) are open.
- A 10 kΩ pot across the battery; its wiper goes to +IN (pin 3).
- −IN (pin 2) is wired straight to the output (pin 5): the amplifier follows its own input.
- Output → 470 Ω → red LED → ground. A voltmeter reads the output.

## Observable behaviour
- Turning the pot up brightens the LED smoothly from dark to full.
- The output follows the wiper to within a few tenths of a volt, but it never rises above about 8.1 V: the LM386 cannot drive its output closer than about 0.9 V to either supply rail.
- At full turn the wiper is at 9 V and the LED carries about 13 mA, its 470 Ω resistor setting the ceiling. At the bottom of the pot the output stays at 0.9 V, below the LED's forward voltage: dark.
- The pot itself carries only its own 0.9 mA; the LED current comes from the amplifier.

## Measured on the engine
| pot position | wiper | output | LED current |
|---|---|---|---|
| pot 0 % | 0.00 V | 0.90 V | 0 mA |
| pot 25 % | 2.17 V | 2.34 V | 1.6 mA |
| pot 50 % | 4.29 V | 4.40 V | 5.8 mA |
| pot 75 % | 6.51 V | 6.57 V | 10.2 mA |
| pot 100 % | 9.00 V | 8.10 V | 13.4 mA |

The wiper at mid-travel reads 4.29 V rather than 4.5 V because the chip's +IN has its own input resistance to ground inside.

## What this verifies
1. A power amplifier with its output fed back to −IN is a follower: the output copies the input.
2. The follower drives a load the pot could not, without loading the pot.
3. The output swing has a ceiling below the supply, so the LED current is capped.

## Simulation notes
The LM386 model's output is vout = Vs/2 + 20·(v+ − v−) inside 0.9 V .. Vs − 0.9 V. With v− = vout this gives vout = (4.5 V + 20·v+)/21: a hair above the wiper below mid-supply, a hair below it above. `test/lab-circuits-r6b.test.mjs` sets the pot and reads the output and the LED current.

```assert
# t = 1 ms, pot at its authored mid position.
net potentiometer_3.wiper V 4.286 +-0.03
net lm386_4.vout V 4.401 +-0.03
net led_6.anode V 1.699 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **29 of this page's 35** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-dimmer` prints them one by one.
<!-- engine-provenance -->
