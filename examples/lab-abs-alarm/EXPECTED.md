# lab-abs-alarm — expected behaviour

## Circuit
- 9 V supply. The "wheel" is a small motor (`dc_motor_encoder_3`) running straight from the battery; a magnet on its shaft passes a Hall switch once per turn, which is the motor's pulse output (one pulse per revolution, 72 per second at full speed).
- The start of each pulse, passed by 100 nF and 10 kΩ (47 kΩ from base to ground), turns on an NPN (`npn_8`) that empties a timing capacitor (470 nF), which 100 kΩ from +9 V otherwise charges. Only the edges count: a magnet that stops right at the switch must not keep the detector reset. One half of an LM358 (`lm358_11`) compares the capacitor (− input) with half the supply (+ input, with 100 kΩ of positive feedback so it snaps): its output is high while the wheel turns.
- A `cd4093` (`cd4093_15`): gate 1 inverts the comparator for the red LED ("wheel stopped"), gate 2 inverts it again for the green LED ("wheel turning"), each with 1 kΩ.
- Warning tone: an LM386 (`lm386_22`, pins 1 and 8 joined) relaxation oscillator (1 MΩ / 1 MΩ, 220 kΩ, 56 nF) with 220 µF to the speaker. An NPN (`npn_21`, 10 kΩ from gate 2) shorts its timing capacitor while the wheel turns.

## Observable behaviour
- Wheel turning: the pulses keep the capacitor below 1 V; green LED, silence.
- Wheel held (a heavy load on its shaft): no more pulses, the capacitor charges past 4.5 V within about 30 ms; red LED and a warning tone of about 410 Hz.
- Released: the wheel spins up and the pulses switch it back to green.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| state | wheel | LEDs | tone |
|---|---|---|---|
| turning | 450 rad/s | green | silent |
| held (0.05 N·m) | 0 | red | 413 Hz |
| released | spinning up | green | silent |

## What this verifies
1. A missing-pulse detector: as long as pulses come often enough, the timing capacitor never charges far; when they stop, it does. It does not care how fast the wheel turns, only whether it turns.
2. An anti-lock brake watches its wheels the same way: a wheel that stops while the car still moves is skidding, and the brake is eased off.

## Simulation notes
The shaft magnet and Hall switch are the motor part's own pulse output (`dc_motor_encoder`, one pulse per turn). A brief grab gives a brief tone because the pulses reset the detector as soon as the wheel turns again.

```assert
# t = 1 ms: the wheel is starting; comparator reference at half supply, lifted by the positive feedback from the high output
net lm358_11.1_pos V 4.64 +-0.02
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-abs-alarm` prints them one by one.
<!-- engine-provenance -->
