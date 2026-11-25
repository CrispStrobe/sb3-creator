# lab-tone-thermometer — expected behaviour

## Circuit
9 V. An LM386 audio power amplifier (the engine's stand-in for a TBA820-class amp chip) is the tone
source: its output returns to its − input through three 10 nF / 10 kΩ high-pass sections, its + input is
grounded and 10 µF across its gain pins sets the gain to 200 for the tone. That is a phase-shift
oscillator; it runs so far into its limits that the output is nearly a square wave of about 550 Hz.

Through a 10 µF capacitor (1 kΩ to ground behind it) the tone drives a bridge. The tone reaches the wiper
of a 10 kΩ trimmer; each end of the trimmer goes through 2.2 kΩ to an NPN transistor wired as a diode
(base and collector together, emitter to ground). An earphone sits between the two transistors.

Each transistor has a 220 Ω heating resistor next to it, switched by its own button. The transistors'
junctions follow the engine's thermal model: their forward voltage falls by a couple of millivolts for
every kelvin they warm. Their thermal time constants are shortened to a few milliseconds so a simulation run stays
short; a real transistor warmed by a resistor or a finger takes seconds.

## Observable behaviour
- Both transistors at room temperature, trimmer centred: the two halves of the bridge are mirror images,
  both junctions carry the same current at the same voltage, and the earphone between them is silent.
- Press the first button, which heats the first transistor. It warms by about 14 K, its junction voltage
  drops by a few tens of millivolts, and during every positive half of the tone its side sits that much lower than the
  other. Across the earphone that is about 17 mV rms. The earphone now carries a square wave at the tone's pitch: the tone is back.
- Turn the trimmer towards the warm side (up to about 0.85): more current goes to the warm transistor, which
  raises its junction voltage again, and the earphone falls silent at a new balance point. The trimmer
  position at the null reads the temperature difference.
- Heat the other transistor as well: the difference disappears, the null returns to the centre of the
  trimmer. The bridge measures a difference of temperature, not the temperature itself.

## What this verifies
1. A transistor junction is a thermometer: at a fixed current its voltage falls by a couple of
   millivolts per kelvin.
2. A bridge with an AC source and an earphone is a null detector: silence means balance.
3. Changing the current ratio (the trimmer) shifts a junction voltage and can cancel a temperature
   difference.

```assert
# t = 1 ms: the oscillator is starting; the amp's bias network holds its bypass pin at half supply,
# and the two junctions, at the same temperature and current, sit at the same voltage
net lm386_3.bypass V 4.487 +-0.03
net npn_16.base V 0.648 +-0.01
net npn_17.base V 0.648 +-0.01
```
