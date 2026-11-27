# lab-opamp-hysteresis — expected behaviour

## Circuit
- 9 V supply. INPUT pot (potentiometer_3, 100 kΩ) from +9 V to ground; voltmeter_14 reads its wiper.
- LM324 section 1: a follower of the wiper. BUFFER (slide_switch_5): left takes the input straight from the wiper, right from the follower (as built: right).
- Section 2: the Schmitt trigger. − input on 3.64 V (10 kΩ / 6.8 kΩ). + input through 10 kΩ from the input, and through 47 kΩ (WIDTH, slide_switch_7, left, as built) or 15 kΩ (right) from its own output. Red LED (led_13): output high.

## Observable behaviour
Turn the knob up until the red LED lights, then down until it goes out; the meter shows both switching points.
- Buffered, 47 kΩ: on at 4.42 V, off at 2.88 V: a window 1.54 V wide.
- Buffered, 15 kΩ: on at 6.06 V, off at 1.26 V: 4.8 V wide.
- Unbuffered, 47 kΩ: on at 6.41 V, off at 1.35 V: 5.06 V wide. The pot's own resistance (up to 25 kΩ in the middle) adds to the 10 kΩ.
- Unbuffered, 15 kΩ: on at 7.91 V, off at 0.31 V: 7.6 V wide, nearly the whole output swing.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs` (switching points found by bisection on the knob): widths 1.538 V, 4.800 V, 5.06 V, 7.596 V.

## What this verifies
1. The window is the output swing times input resistance over feedback resistance: 7.22 V × 10/47 = 1.54 V.
2. A source with resistance of its own changes that ratio; a follower in front makes the window independent of the source.

## Simulation notes
With the buffer the input can reach at most 7.5 V (the follower's upper limit), which is why the reference is 3.64 V and not 4.5 V: both switching points then stay in reach for both feedback resistors.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net voltmeter_14.a V 4.489 +-0.01
net resistor_10.b V 3.643 +-0.01
net lm324_4.2_out V 7.22 +-0.03
net lm324_4.2_pos V 4.968 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **22 of this page's 36** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-hysteresis` prints them one by one.
<!-- engine-provenance -->
