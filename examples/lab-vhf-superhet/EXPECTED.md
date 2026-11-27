# lab-vhf-superhet — expected behaviour

## Circuit
- Aerial: a half-wave folded dipole (0.95 m, 300 Ω) through 1 pF onto the aerial tank — an air-core VHF coil (0.135 µH, Q 60) with a BB910 varicap across it (through 1 nF) — and from its top through 2.2 pF into input A of the mixer IC (input B held by 100 nF).
- Local oscillator: the mixer IC's own transistor as a Colpitts oscillator (10 pF base–emitter, 22 pF emitter–ground) on a second tank (0.0987 µH, Q 60, a second BB910) through 10 pF.
- Tuning: both varicaps get one tuning voltage from the tuning pot through 100 kΩ each; at 0.75 it is 4.5 V and the two tanks sit about 98 MHz (aerial) and 108.7 MHz (oscillator): 10.7 MHz apart, and they move together.
- IF: output A into a 10.7 MHz ceramic filter, its output into the FM IF IC (limiter and quadrature detector). The detector's output (10 nF) through 100 nF into a crystal earphone. 6 V.
- Broadcast: two FM stations from the north, 98.0 MHz (50 mV/m, 1 kHz tone) and 89.0 MHz (20 mV/m, 600 Hz tone), both 75 kHz deviation.

## Observable behaviour
- As authored (tuning 0.75): the 98 MHz station's 1 kHz tone at the IF chip's output, about 0.2 V peak, clean (its 2 kHz harmonic about 1 % of it).
- Tuning pot at 0.60: the difference between oscillator and station misses the filter: no tone (below a microvolt).

## Measured on the engine
bw-board RF envelope bands (the oscillator in its own band, the station in the aerial band, their difference planned into the ceramic filter's band, the IF chip reading the IF's frequency from that envelope's phase), `test/lab-circuits-r11.test.mjs`, after 1.5 ms, 2 ms of audio at 10 µs: tuned, 1 kHz 0.22 V and 2 kHz 2.8 mV, the IF at the filter's output 7 mV; at 0.60, 7×10⁻⁷ V at 1 kHz. The oscillator runs about 285 kHz below the tank the resonance scan sees (its transistor's capacitances pull it): 108.70 MHz. About 13 000 band substeps and 4 000 transient solves per simulated millisecond.

## What this verifies
1. Superheterodyne reception at VHF: the station and a local oscillator 10.7 MHz above it mix into a fixed IF; the ceramic filter selects it.
2. FM detection after limiting: the quadrature detector's output follows the IF's frequency, so it carries the programme.
3. Tracking: one tuning voltage moves both tanks.

## Not modelled
- The aerial and oscillator tanks track only near one setting (two coils on the same varicap curve); the IF chip's AGC and tuning-meter outputs; the IF chip's quadrature-coil knob is not exercised here (a misaligned coil and "each station twice on the filter slopes" are not asserted); the interference clicks and supply howl of the same receiver are not built.

```assert
# supply; the tuning voltage (pot at 0.75 of 6 V); the mixer's input bias (0.23 of the supply)
net vsource_2.pos V 6.00 +-0.01
net potentiometer_10.wiper V 4.50 +-0.05
net sa612_12.in_b V 1.38 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 41** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-vhf-superhet` prints them one by one.
<!-- engine-provenance -->
