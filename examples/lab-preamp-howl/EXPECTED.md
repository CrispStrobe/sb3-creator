# lab-preamp-howl — expected behaviour

## Circuit
- 9 V supply. A 2 kΩ magnetic earphone (`earphone_3`) is the microphone; it hears the loudspeaker (`hears`) from `distanceCm` = 5 cm (the **Distance** slider).
- 220 nF into the preamp NPN (`npn_7`): 4.7 kΩ collector load, 470 kΩ collector-to-base, 100 Ω in the emitter (gain about 35).
- 1 µF to the top of a 10 kΩ volume pot (`potentiometer_10`, full as authored), the wiper into the LM386 (`lm386_11`, gain 20), 220 µF into the 8 Ω speaker.

## Observable behaviour
- Switch-on: the preamp's collector falls from the supply to about 4.9 V as its bias settles; that step reaches the speaker as a thump.
- 5 cm, full volume: by 35 ms the loop howls by itself, a whistle of about 2.9 kHz at the speaker's full rated current (level 1); the amplifier swings rail to rail.
- 40 cm, full volume: only the dying thump, no whistle.
- 5 cm, volume at 0.1: no whistle either.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs`.

## What this verifies
1. An earphone is also a microphone, and sound pressure falls with distance.
2. A loop whose gain exceeds one oscillates by itself; distance and the volume pot both set the loop gain.

## Simulation notes
The coupled pressure is the engine's acoustic link: K·i(t − r/c)/r_eff from the speaker's coil current. The whistle's pitch is set by where the coupling capacitors and the delay give the loop the most gain, not by any tuned part.

```assert
# power-on: supply and the LM386's bias divider
net vsource_2.pos V 9.00 +-0.01
net lm386_11.bypass V 4.50 +-0.05
net npn_7.emitter V 0.00 +-0.01
```
