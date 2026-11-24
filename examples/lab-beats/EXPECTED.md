# lab-beats — expected behaviour

## Circuit
9 V supply, two 555 astables, each with a 10 µF timing capacitor, 4.7 kΩ from
the supply to DISCHARGE and 10 nF on the control pin:

- **Oscillator A (red LED):** 12 kΩ between DISCHARGE and THRESHOLD, about
  5.0 Hz.
- **Oscillator B (green LED):** 10 kΩ plus the **tune B** potentiometer
  (2.2 kΩ, used as a variable resistor, as authored at 0.3), about 5.5 Hz.
- **Together detector:** two diodes from a 4.7 kΩ pull-up to the two outputs
  form an AND: the node is high only while BOTH outputs are high. Through
  10 kΩ (10 kΩ base pull-down) it switches a yellow "together" LED.
- **Mixer:** each output also feeds a piezo through 10 kΩ, so the speaker gets
  the sum of both oscillators.

The oscillators are slowed down to a few hertz so that their phase can be
watched on the LEDs; at audio speed the same thing is heard as a wobbling tone.

## Expected behaviour
- The two LEDs blink at almost the same rate and slowly drift in and out of
  step.
- When they are in step, the yellow LED flashes with every blink, for almost
  half of each period. When they are opposite, it stays dark.
- That swelling and fading repeats at the DIFFERENCE frequency: 5.5 − 5.0 =
  0.5 times a second, once every two seconds. This is the beat.
- Turning **tune B** towards the other frequency makes the beat slower; at
  equal frequencies it stops (zero beat).

## Measured on the engine
Counted over 6 s, sampled every millisecond by `test/lab-circuits-1.test.mjs`:

| quantity | value |
|---|---|
| oscillator A | 4.99 Hz |
| oscillator B | 5.50 Hz |
| beat (difference) | 0.50 Hz |

```assert
# oscillator A: 1.44 / ((4.7k + 2 x 12k) x 10 uF)
buzzer_tone_hz: 5.02 +- 0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@7e0bf8c` and `bw-circuit-ui@4c57f3a` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 17** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-beats` prints them one by one.
<!-- engine-provenance -->
