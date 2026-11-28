# lab-spark-transmitter — expected behaviour

## Circuit
- Transmitter: the 9 V battery charges 470 µF through 1 kΩ; a push button dumps it through the winding of an untuned ferrite rod (nothing across the winding). The button's contact bounces: four quick reversals within 3 ms of a press.
- Receiver, 30 cm away on a second rod: an antenna on the rod's tap, the tuning capacitor across the main winding, a germanium diode into 47 kΩ ‖ 2.2 nF, then 100 nF into an LM386 (gain 20) and a loudspeaker on 220 µF.
- Three broadcast stations (612, 810 and 1215 kHz) reach the antenna.

## Observable behaviour
- Dial at 0.15 (about 1.1 MHz, between stations): silence. Press the button: a loud click — the receiver's tank rings up to volts and the detector jumps by several volts, then decays over a few milliseconds.
- Dial at 0.50: the 612 kHz station's 400 Hz tone; a press adds the click on top.
- The click comes at every setting of the dial: the transmitter has no frequency of its own.

## Why a switched coil is a transmitter
The bouncing contact makes and breaks the coil's current in far less than a microsecond. A current that steps changes its magnetic field just as abruptly, and the receiving rod, linked to it by that field, gets an EMF M·di/dt: a very short pulse. A short pulse contains every frequency at once, so whatever frequency the receiver is tuned to, its tank is struck and rings at its own resonance — the same as a sharp tap on a bell. This is how the first radio transmitters worked: a spark switched the current, and they were heard right across the dial.

## Measured on the engine
`test/lab-circuits-r7mw.test.mjs`: at 0.15, the receiving tank at 5 µV before the press and up to 8 V after it, the detector at 7.6 V; at 0.50, the 612 kHz carrier at 0.44 V on the tank before any press.

```assert
# supply; the LM386's bias; the untuned rod's winding at ground for DC
net vsource_2.pos V 9.00 +-0.01
net lm386_16.bypass V 4.50 +-0.05
net ferrite_coil_7.b V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-spark-transmitter` prints them one by one.
<!-- engine-provenance -->
