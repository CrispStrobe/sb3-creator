# lab-wien-mosfet — expected behaviour

## Circuit
- 9 V supply. LM324 section 2 buffers a half-supply reference.
- Section 1: non-inverting amplifier, 10 kΩ feedback against 4.3 kΩ plus the channel of a depletion dual-gate MOSFET (dual_gate_mosfet_12, both gates together) to the reference.
- Wien network from the output to the + input: 15 kΩ + 10 nF in series, 15 kΩ ‖ 10 nF to the reference.
- Amplitude control: a germanium diode (diode_13) through 22 kΩ from the output charges 220 nF on the gates negative on every downward peak; 1 MΩ lets the charge leak back.
- AGC OFF (switch_16) shorts the gates to the source. Voltmeter_17 reads output against reference.

## Observable behaviour
- About 1.06 kHz. The oscillation starts from the switch-on transient, overshoots a little, and within about 150 ms its swing settles at 2.46 V pp (1.2 V peak), a clean sine well inside the op-amp's range. The gates then sit at −0.91 V, just short of pinch-off.
- AGC OFF: the gain stays above three, the oscillation grows until the output hits its limits (more than 5 V pp) and the sine flattens.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: 1.057 kHz, a swing of 2.46 V pp after 160 ms with the gates at −0.91 V; with AGC OFF 7.45 V pp within 30 ms.

## What this verifies
1. A Wien network passes a third of the signal at f = 1/(2πRC) with no phase shift: a gain of exactly three keeps it going.
2. A depletion MOSFET's channel is a resistor that its gate voltage sets; feeding back the rectified amplitude makes the gain settle at three by itself.

## Simulation notes
The 22 kΩ in the diode's lead slows the control's attack. Without it the first burst charged the gates past pinch-off, the gain fell below three, and the oscillation died and restarted (squegging) before it settled.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_3.2_out V 4.5 +-0.01
net dual_gate_mosfet_12.gate1 V 4.5 +-0.02
net lm324_3.1_out V 4.5 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-wien-mosfet` prints them one by one.
<!-- engine-provenance -->
