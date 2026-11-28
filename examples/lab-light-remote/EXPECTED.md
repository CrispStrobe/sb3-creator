# lab-light-remote — expected behaviour

## Circuit
- 9 V supply. Transmitter, switched by `switch_3`: a two-transistor astable (`npn_7`, `npn_8`; 100 nF coupling capacitors) whose base resistors are 4.7 kΩ plus the two halves of a 10 kΩ duty potentiometer (`potentiometer_11`, wiper on the supply), so the pot moves the on/off ratio while the period stays about 1.4 ms. A red LED (`led_6`, 470 Ω) in one collector flashes.
- Light path (`light_path_24`, air, 3 cm as built; the knob is the distance).
- Receiver: a phototransistor (`phototransistor_14`, 4.7 kΩ on its emitter) into the + input of an LM386 (`lm386_18`) through 100 kΩ; 1.8 MΩ from +9 V holds the − input at 0.24 V, so without light the output rests low. A slide switch (`slide_switch_19`) gives the output to a green LED (470 Ω) or to a small motor (`dc_motor_22`, flyback diode).

## Observable behaviour
- The far LED flashes with the transmitter, too fast to see: it looks dimmer or brighter as the duty pot is turned. With the pot at 0.1 it is lit 77 % of the time, at 0.9 only 38 %.
- On the motor position the motor runs while light pulses arrive (234 rad/s at duty pot 0.1); switching the transmitter off drops the drive to 0.9 V and the motor coasts down (157 rad/s 0.3 s later).

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| setting | far LED lit | motor |
|---|---|---|
| duty pot 0.1 | 77 % of the time | 234 rad/s |
| duty pot 0.9 | 38 % | — |
| transmitter off, 0.3 s later | — | coasting, 157 rad/s |

## What this verifies
1. The share of time a pulse is on (the duty cycle) can carry a setting over a link that only knows on and off: the eye and the motor average it.
2. The receiver drives its load without any wire to the transmitter.

```assert
# t = 1 ms, transmitter switched off: receiver dark, LM386 output resting low
net lm386_18.vout V 0.90 +-0.02
net lm386_18.inn V 0.243 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-light-remote` prints them one by one.
<!-- engine-provenance -->
