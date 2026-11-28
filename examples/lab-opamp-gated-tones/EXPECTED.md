# lab-opamp-gated-tones — expected behaviour

## Circuit
- 9 V supply, one LM324.
- Section 1: slow astable (Schmitt trigger, thresholds 3 V / 5.5 V, 100 kΩ into 1 µF: about 7 Hz; RATTLE, slide_switch_9 right, swaps in 100 nF: about 70 Hz). Green LED (led_18) on its output.
- Section 2: tone astable (the same trigger, 22 kΩ into 47 nF, capacitor_15): about 640 Hz. Loudspeaker (speaker_21) through 10 µF and 220 Ω.
- A 1N4148 (diode_16) from section 1's output onto the tone's timing capacitor: while the slow output is high it holds that capacitor above the upper threshold and the tone stops.

## Observable behaviour
- As built: short pips of tone about seven times a second, a chick's cheep; the green LED is lit in the pauses.
- RATTLE: the gate opens and closes about 70 times a second: a rattle.
- Each burst starts with a slightly long first half-cycle (the capacitor first falls from where the diode held it), then runs at the tone's own pitch.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs` (RATTLE): gate 69.5 Hz; 24 tone half-periods in 60 ms, all while the gate is open, none more than 0.3 ms into a closed gate.

## What this verifies
1. One oscillator can switch another through a diode on its timing capacitor.
2. The gating rate, not the tone, makes the effect: a few bursts a second are pips, tens a second are a rattle.

## Simulation notes
The slow setting works by the same mechanism and is checked at RATTLE speed, because each tone cycle costs the solver a few hundred steps.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_3.1_pos V 5.403 +-0.03
net lm324_3.1_out V 7.209 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-gated-tones` prints them one by one.
<!-- engine-provenance -->
