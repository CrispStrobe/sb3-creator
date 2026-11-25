# lab-ac-voltmeter — expected behaviour

## Circuit
- 9 V supply; op-amp 4 of an LM324 buffers half the supply (10 kΩ / 10 kΩ), the reference every stage works around.
- **Oscillator** (op-amp 1, Wien bridge): 16 kΩ + 10 nF in series from the output to the + input, 16 kΩ ‖ 10 nF from there to the reference: about 1 kHz. Gain: 12 kΩ + 15 kΩ in the feedback, 10 kΩ to the reference; two 1N4148 back to back across the 15 kΩ bring the gain down to three as the sine grows.
- **LEVEL** pot (10 kΩ from the oscillator output to the reference).
- **RANGE** amplifier (op-amp 3): a follower on the coarse range; 9.1 kΩ / 1 kΩ (gain 10.1) on the fine range.
- **Superdiode** (op-amp 2): a follower with a 1N4148 inside its loop; its output P only ever goes above the reference.
- **MODE**: AVERAGE puts 220 Ω from P to the reference, so P carries the half waves; PEAK connects P straight to the 1 µF instead. A sensitive moving-coil meter (one volt full scale, a megohm of its own) sits across the 1 µF, fed from P through 10 kΩ.
- An oscilloscope shows the oscillator (channel 1) and P (channel 2).

## Observable behaviour
- The oscillator settles near 980 Hz; its swing reaches 1.83 V at peak.
- AVERAGE (as authored): the meter reads close to peak/π.
- PEAK: the meter climbs to the peak.
- Fine range with LEVEL at 5 % in AVERAGE: about ten times what the coarse range would show for the same small signal.

| MODE | RANGE | LEVEL | meter (V) | as a fraction |
|---|---|---|---|---|
| average | coarse | full | 0.565 | 0.97 × peak/π |
| peak | coarse | full | 1.82 | 0.996 × the peak |
| average | fine (×10.1) | 5 % | 0.313 | |

## Measured on the engine
`test/lab-circuits-r6e.test.mjs` holds the table above: the oscillator's swing (1.83 V at peak) read from its output, then the meter averaged over a few milliseconds in each setting.

## What this verifies
1. A diode inside an op-amp's feedback loop rectifies without losing its diode drop, so even signals of a tenth of a volt can be measured.
2. A half-wave's average is peak/π; for a sine the RMS value is peak/√2, 2.22 times that average, which is how an averaging meter is scaled to read RMS.
3. A capacitor charged through the superdiode holds the peak.

## Simulation notes
The average reads a few per cent under peak/π: the op-amp's turnaround at each zero crossing and the meter's own 1 MΩ. The peak hold leaks away through the meter (1 MΩ × 1 µF = 1 s), so after a lower LEVEL it takes a while to come down, as on a real peak meter.

```assert
# the reference all stages work around
net lm324_3.4_out V 4.50 +-0.01
net resistor_4.b V 4.50 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ac-voltmeter` prints them one by one.
<!-- engine-provenance -->
