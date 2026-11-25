# lab-chopped-spark — expected behaviour

## Circuit
- A two-transistor astable (47 kΩ base resistors, 10 nF cross-coupling capacitors: about 1.5 kHz); one collector load is the winding of an untuned ferrite rod in series with 1 kΩ, the other 1 kΩ.
- The rod takes its current straight from the 9 V battery; the rest of the astable is fed through 47 Ω, held by 22 µF.
- Receiver, 30 cm away on a second rod: antenna on the tap, tuning capacitor, germanium diode into 47 kΩ ‖ 2.2 nF, 100 nF into an LM386 (gain 20), loudspeaker on 220 µF.

## Observable behaviour
- About 1 ms after switch-on the astable runs; from then on the detector jumps every 0.65 ms (about 1.5 kHz) and the loudspeaker plays that tone.
- The tone is there at any setting of the tuning knob: at 0.15 (about 1 MHz, between stations) as at 0.40 (about 680 kHz).

## Why the receiver plays the astable's pitch
Each time the transistor with the rod in its collector switches, the rod's current jumps (on) or collapses (off) within a fraction of a microsecond. Each jump is a short broadband pulse in the receiving rod, which strikes its tuned circuit at whatever frequency it is set to. The detector turns every strike into a click; 1500 clicks a second are a tone. A transmitter like this — interrupted current, a tone in any receiver — imitates the quenched-spark transmitters of early radio, and it is also why switching circuits need screening.

## Measured on the engine
`test/lab-circuits-r7mw.test.mjs`: detector pulses of 0.03–0.4 V every 0.65 ms at both settings; the receiving tank stays below 0.1 mV between pulses at 0.15.

```assert
# supply and the LM386's bias
net vsource_2.pos V 9.00 +-0.01
net lm386_23.bypass V 4.50 +-0.05
net lm386_23.inn V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-chopped-spark` prints them one by one.
<!-- engine-provenance -->
