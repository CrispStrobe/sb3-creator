# lab-relax-tone — expected behaviour

## Circuit
9 V. A 47 nF capacitor charges through 22 kΩ plus a 22 kΩ rheostat (authored at mid-travel, so half of it
is in circuit). The capacitor is the emitter of a PNP transistor whose base sits on a 1 kΩ / 2.2 kΩ divider
(6.19 V). The PNP's collector feeds an NPN's base (100 kΩ from base to emitter); the NPN's collector pulls
the PNP's base down. The NPN's emitter goes to ground through 220 Ω, and a piezo earpiece sits across
that resistor.

## Observable behaviour
- The same relaxation cycle as the flasher: the capacitor charges to about 6.86 V, one junction drop above
  the PNP's base, the pair fires, dumps it through the 220 Ω resistor down to about 2.3 V, lets go, and
  the charging starts again.
- With a capacitor this small each cycle lasts only about two milliseconds: with the rheostat in the
  middle the piezo hears a buzzing tone of roughly 550 Hz. The cycle length wanders a little from one
  cycle to the next, so the pitch is read as an average over several cycles.
- Turn the rheostat to its minimum (22 kΩ left): the capacitor charges faster and the pitch rises to
  about 750 Hz. Turned the other way, the pitch falls.
- The piezo only sees the short discharge pulse across the 220 Ω resistor, so the sound is a buzz rich in
  overtones, not a pure tone.

## What this verifies
1. The PNP-NPN relaxation oscillator scales with its timing capacitor: 47 nF puts it in the audio range.
2. Less charging resistance gives a higher pitch.

```assert
# t = 1 ms: divider at 2.2/3.2 of 9 V; the capacitor is part-way up its first charge
# through the 22 k plus half the rheostat (time constant about 1.55 ms), the pair has not fired yet
net pnp_6.base V 6.1875 +-0.02
net capacitor_5.a V 4.278 +-0.05
net resistor_3.b V 5.852 +-0.05
net npn_7.emitter V 0.000 +-0.01
```
