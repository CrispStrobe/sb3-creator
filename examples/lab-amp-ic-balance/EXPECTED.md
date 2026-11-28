# lab-amp-ic-balance — expected behaviour

## Circuit
- 9 V battery, one LM386 wired as a follower: −IN (pin 2) to the output (pin 5); pins 1, 7 and 8 open.
- A 10 kΩ pot across the battery; wiper → 2.2 kΩ → +IN (pin 3).
- A slide switch connects a 470 µF electrolytic from +IN to ground (the lag); as authored it is off, the capacitor's minus lead left open.
- Red LED: output → 470 Ω → red LED → ground. Green LED: battery + → 470 Ω → green LED → output.

## Observable behaviour
- Pot at one end: only green lights (the output is low, so green has the whole battery minus 0.9 V across it). Other end: only red. In the middle both glow about equally.
- Turning the pot slides the light from green to red: a balance control.
- Lag on: the capacitor must charge through 2.2 kΩ (plus the pot's own resistance), so the light follows the pot slowly, over about two seconds.

## Measured on the engine
| pot position | output | red | green |
|---|---|---|---|
| pot 0 % | 0.90 V | 0 mA | 12.8 mA |
| pot 50 % | 4.23 V | 5.4 mA | 5.9 mA |
| pot 100 % | 8.10 V | 13.4 mA | 0 mA |

Pot from 0 to full in one move: lag off, the output is at 8.10 V within 20 ms. Lag on: 0.90 V after 20 ms, 3.55 V after 0.5 s, 7.51 V after 2 s.

## What this verifies
1. A follower's output can source current into one LED and sink it from the other.
2. One control sets the share of light between two lamps.
3. An RC in front of the follower makes its output lag behind the control.

## Simulation notes
The 2.2 kΩ and the chip's own input resistance divide the wiper slightly (about 4 %). `test/lab-circuits-r6b.test.mjs` sets the pot, flips the lag switch and times the response.

```assert
# t = 1 ms, pot at mid position, lag off.
net potentiometer_3.wiper V 4.294 +-0.03
net lm386_7.inp V 4.113 +-0.03
net lm386_7.vout V 4.233 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 30** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-balance` prints them one by one.
<!-- engine-provenance -->
