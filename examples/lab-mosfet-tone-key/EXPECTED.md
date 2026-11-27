# lab-mosfet-tone-key — expected behaviour

## Circuit
- 9 V supply. LM386 (lm386_3) relaxation oscillator: 47 kΩ from the output and 100 kΩ from +9 V set the + input's moving threshold (1 nF speed-up); 10 kΩ and 220 nF from the output to the − input set the pitch. Loudspeaker through 47 µF and 47 Ω.
- Key: a depletion dual-gate MOSFET (dual_gate_mosfet_13), source and gate 2 at ground. Its drain pulls the oscillator's + input down through a germanium diode (diode_16) while the channel conducts. Drain load: 4.7 kΩ and a red LED (led_15) from +9 V, which shows the channel current.
- Gate 1 is a bare antenna wire (field_probe_12, a ruler charged to minus two kilovolts; the knob is how near it is, 0 = far away).

## Observable behaviour
- Ruler far away: gate 1 at 0 V, the channel conducts (LED on, about 1.5 mA), drain about 0.3 V, + input held at about 0.5 V: silent.
- Ruler brought a third of the way: the induced charge takes gate 1 to about −2.2 V, beyond the −1.2 V pinch-off. The channel closes, the LED goes out, the drain rises to about 7.8 V, the diode lets go and the tone sounds (about 280 Hz, 7.2 V peak to peak at the output).
- Ruler held still: the gate keeps its charge and the tone goes on.
- Ruler taken away: the gate returns to 0 V and the tone stops; the LED lights again.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10d.test.mjs` (with the ruler's movement shortened to 5 ms): rest gate 0.000 V, drain 0.303 V, + input 0.506 V, LED 1.511 mA, output 0.0002 V pp; ruler at 0.3: gate −2.218 V, drain 7.835 V, LED 0 mA, output 7.178 V pp, period 3.56 ms; ruler away: gate 0.004 V, silent.

## What this verifies
1. A depletion MOSFET conducts with its gate at the source potential and is switched off by a negative gate, here a charge induced by a field.
2. Its insulated gate holds the induced charge: the tone keeps going while the ruler is held still.

## Simulation notes
The ruler's sign is the field probe's rodVolts; a positively charged object would only open the channel further, and nothing would sound. The germanium diode keeps the clamped + input (0.5 V) below the lowest voltage the − input reaches (the output floor, 0.9 V), so the clamp holds the oscillator off reliably. Every flip of the LM386 oscillator costs the solver many steps, so the scenario listens to the tone for a few milliseconds only.

```assert
# 1 ms after switch-on, no ruler: channel on, oscillator held off
net lm386_3.inp V 0.506 +-0.03
net dual_gate_mosfet_13.drain V 0.303 +-0.03
net lm386_3.vout V 0.899 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 35** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mosfet-tone-key` prints them one by one.
<!-- engine-provenance -->
