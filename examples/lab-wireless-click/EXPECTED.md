# lab-wireless-click — expected behaviour

## Circuit
- 9 V supply (`vsource_2`). The push button (`button_3`) connects it through 10 Ω (`resistor_4`) to a 20-turn sending coil 6 cm across (`induction_loop_5`, 0.5 mm wire).
- A 1000-turn receiving coil (`air_coil_6`, 3 cm long, 1.5 cm radius) sits a hand's width away. The sending coil's dial sets the distance: 0.76, about 8 cm, at rest; 0 is 30 cm, 1 is 1 cm.
- The receiving coil feeds a germanium diode (`diode_7`, 1N34A) into a crystal earphone (`earphone_8`) with 100 kΩ (`resistor_9`) across it.

## Observable behaviour
- Before the press: nothing at the earphone.
- Press: the current rises to 0.9 A within a few microseconds (L/R of the sending coil). The rising field induces a pulse in the receiving coil, about 0.46 V at the earphone: a click.
- Holding the button: nothing. A steady current induces nothing.
- Release: the induced pulse is reversed, and the diode blocks it.
- Coils 24 cm apart (dial 0.2): the pulse is about 0.0008 V. The field of a coil falls with the cube of the distance.

## Measured on the engine
bw-board master 2c62bd54, `test/lab-circuits-r7mech.test.mjs`: press peak 0.46 V at 8 cm and 0.0008 V at 24 cm. Held and released, the earphone stays below 1 mV.

## What this verifies
1. Only a CHANGING current induces a voltage in a neighbouring coil (mutual induction, e = M·dI/dt).
2. The coupling falls off steeply with distance.
3. A diode passes one polarity of the induced pulse.

## Simulation notes
The two coils are coupled by the mutual inductance of a loop's on-axis field through the pickup (bw-board `induction_loop`, src/magnetic-coupling.js), solved as a transformer in the transient solve. The solve is implicit, so the area of the pulse (M·ΔI) does not depend on the step size. The receiver here is a pickup COIL in the magnetic near field. The original experiment used two short wire stubs and the spark's broadband electric radiation, which the engine does not model. The spark at the contacts on release is not modelled either.

```assert
# at rest: the button is open, so no current flows and nothing is induced
net vsource_2.pos V 9.00 +-0.01
net induction_loop_5.a V 0.00 +-0.001
net earphone_8.a V 0.00 +-0.001
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **3 of this page's 9** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-wireless-click` prints them one by one.
<!-- engine-provenance -->
