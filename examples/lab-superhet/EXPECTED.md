# lab-superhet — expected behaviour

## Circuit
- Aerial: antenna on the tap of a ferrite rod tuned by the first tuning capacitor (0.512: 612 kHz); its coupling winding drives the gate of an n-channel MOSFET biased from a 100 kΩ / 68 kΩ divider (held by 10 nF at the winding's cold end), source 330 Ω ‖ 100 nF, drain 2.2 kΩ to the supply.
- Mixer IC: the drain feeds input A through 1 nF, input B is held by 100 nF. Its oscillator transistor runs as a Colpitts oscillator (220 pF base–emitter, 470 pF emitter–ground, 100 µH ‖ the second tuning capacitor through 10 nF), at 0.127 about 1068 kHz.
- IF: the two outputs drive the ends of a 25 µH coil whose middle tap is on the supply (push-pull), 4.7 nF plus a trimmer across it: about 457 kHz. Its coupling winding drives an NPN IF amplifier (47 kΩ / 10 kΩ, 10 nF; 1 kΩ ‖ 100 nF; 4.7 kΩ), whose collector a germanium diode detects (10 nF, 2.2 nF, 47 kΩ); 100 nF into an LM386 (gain 20) and a loudspeaker on 220 µF. 6 V supply.
- Switches: "Low IF" adds 6.8 nF across the IF tank (about 296 kHz); "Loose" moves the antenna from the tap to a 10 pF capacitor.
- Broadcast: 612 kHz (400 Hz tone), 810 kHz (two tones), 1200 kHz (strong, 1 kHz), 1215 kHz (1 kHz).

## Observable behaviour
- As authored: the 612 kHz station mixes with the 1068 kHz oscillator into the IF tank (0.4 V there) and plays its 400 Hz tone.
- The oscillator knob at 0.15 (about 1040 kHz): the difference misses the IF tank — nothing reaches it (below a microvolt), though the aerial is still on the station.
- Loose coupling, aerial knob retuned to 0.534: the mixer gets less of the station, and the 810 kHz neighbour drops further than the station does (sharper aerial tuning).
- Low IF, oscillator at 0.30 (about 907 kHz): the strong 1200 kHz station — 296 kHz above the oscillator, the image — reaches the IF and its 1 kHz tone mixes in. With the 455 kHz IF its image would be at 1523 kHz, and the 1200 kHz station stays out.
- Not modelled: evening skywave (distant stations growing louder after dark); the broadcast has fixed field strengths.

## Why the oscillator must track the station
The mixer's output contains the product of station and oscillator, so their difference frequency appears there; only when that difference equals the IF does it reach the IF coil, whose tuned circuit lets nothing else through and gives every station the same sharp selectivity. Any station one IF above the oscillator produces the same difference: the image. The aerial circuit alone has to keep it out, which it does when the image is far away (high IF) and fails to do when it is close (low IF) and strong.

## Measured on the engine
`test/lab-circuits-r7mw.test.mjs`: IF tank 0.40 V at 457 kHz (IF collector 1.8 V) after 1.5 ms; 9×10⁻⁸ V with the oscillator at 0.15. With only the 1200 kHz station on the air: 0.175 V in the 296 kHz IF tank with the low IF, 0.11 mV in the 457 kHz tank with the high one.

```assert
# supply; the mixer's input bias (0.23 of the supply); the LM386's -IN on ground
net vsource_2.pos V 6.00 +-0.01
net sa612_16.in_b V 1.38 +-0.03
net lm386_38.inn V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **28 of this page's 61** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-superhet` prints them one by one.
<!-- engine-provenance -->
