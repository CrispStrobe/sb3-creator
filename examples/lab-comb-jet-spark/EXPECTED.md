# lab-comb-jet-spark — expected behaviour

## Circuit
- 9 V supply. Two independent parts.
- **JET**: a red LED (470 Ω) shines across 2 cm of air onto a phototransistor (collector on +9 V, emitter 1 kΩ to ground). A thin stream of tap water falls through the beam (the light path's `jet` medium): at rest it shadows most of the beam. The light path's knob is the distance of a comb charged to 10 kV from the stream, 20 cm … 1 cm. The emitter voltage drives an NPN through 10 kΩ, which lights the green **BEAM** LED (1 kΩ).
- **SPARK**: the comb is a 10 pF capacitance. Combing is a 100 nA current source; **COMB** (slide switch) sends it onto the comb (combing) or straight back to ground (resting, as authored). A 1 mm spark gap from the comb to an earthed electrode breaks down at a little over four kilovolts (the gap model: three kilovolts per millimetre plus an offset). The electrode returns through a 1N4148 onto 10 nF (10 MΩ holds the electrode at ground between sparks); a Darlington pair (two NPN) drains that 10 nF through 4.7 MΩ and flashes the yellow **SPARK** LED (1 kΩ).

## Observable behaviour
- Comb far away: the jet shadows the beam, BEAM dark. Comb at 1 cm: the jet bends out of the beam, BEAM lit. A negatively charged comb does exactly the same.
- Combing: the comb climbs for about 0.43 s, reaching 4.35 kV at peak, sparks, the SPARK LED flashes, and it starts again. Resting: no sparks.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: BEAM dark at 20 cm and 7.0 mA at 1 cm, the same with the comb charged negatively; sparks at 443 and 873 ms of combing (430 ms apart, against C·V/I = 435 ms for 10 pF charged by 100 nA to the gap's four and a third kilovolts), the yellow LED flashing each time; none while resting.

## What this verifies
1. A charged comb pulls a thin water jet sideways whatever its sign: it induces the opposite charge on the earthed stream and attracts it (force ∝ V²).
2. A comb holds a tiny charge (tens of nanocoulombs) at kilovolts; air breaks down at about 3 kV per millimetre, and the spark empties it in a moment.

## Simulation notes
The water jet's bending is the engine's calibrated model (ten kilovolts at two centimetres bends it ten millimetres), not a fluid simulation. The comb's capacitance, charging current and the gap's breakdown line are fixed numbers of the order seen on a dry day; real combing is erratic and humidity lets the charge leak. The circuit can only stand in for the comb: the sparks and the jet themselves are what the device models compute.

```assert
# comb far away and resting: the jet shadows the beam (BEAM dark), the comb uncharged
net phototransistor_5.emitter V 0.484 +-0.02
net npn_9.collector V 7.80 +-0.1
net capacitor_14.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-comb-jet-spark` prints them one by one.
<!-- engine-provenance -->
