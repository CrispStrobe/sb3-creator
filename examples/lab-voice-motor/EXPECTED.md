# lab-voice-motor — expected behaviour

## Circuit
- 9 V battery. An 8 Ω loudspeaker (speaker_3) is the microphone; its **Sound** slider sets the level of a 400 Hz tone at it. It drives the + input of an LM386 (lm386_4) directly, − input grounded; 10 µF across the gain pins sets gain 200, 10 µF on BYPASS.
- LM358 section 1 (lm358_7) amplifies the LM386's output again: 1 µF and 2.2 kΩ in, 100 kΩ feedback (inverting, gain 45) around a 4.5 V midpoint (10 kΩ / 10 kΩ, 10 µF).
- A diode pump (220 nF, 4.7 kΩ to ground, two 1N4148) charges the ENVELOPE capacitor (capacitor_18, 1 µF with 1 MΩ across it).
- LM358 section 2 compares the envelope (− input) with THRESHOLD (potentiometer_21, 10 kΩ under 47 kΩ from +9 V, as built at 0.5) on its + input; 470 kΩ from its output to the + input gives a little hysteresis.
- The comparator output sinks the base current of a PNP (pnp_26, emitter on +9 V, 10 kΩ base to emitter) through 680 Ω and the red RUN LED (led_24). The PNP's collector runs a DC motor (dc_motor_27) to ground, with a 1N4148 across it.

## Observable behaviour
- Silence: THRESHOLD sits at 0.85 V, the comparator output is high (7.5 V), the motor stands. The amplifiers' switch-on ramps leave the envelope at 0.45 V after 0.3 s, well below.
- 70 dB: the LM386 makes 0.018 V peak-to-peak, the op-amp stage 0.77 V; the envelope stays at 0.42 V and the motor stands.
- 85 dB: the LM386 makes 0.1 V peak-to-peak, the op-amp stage 4.3 V. Within 5 ms the envelope passes THRESHOLD, the comparator falls to 0.47 V, RUN lights, the collector rises to 8.8 V and the motor spins up (0.8 A at the start).
- Silence again: the envelope decays; about 1 s later the comparator lets go, the motor current stops and the motor coasts down.

## Measured on the engine
bw-board 818e0263, bw-circuit-ui 659431ce, `test/lab-circuits-ampic.test.mjs` (300 ms silent, 60 ms at 70 dB, 60 ms at 85 dB, then silent): envelope 0.446 V / 0.419 V / 2.052 V; comparator low 5 ms after the loud tone began; motor 84 rad/s 60 ms after it; off again 1000 ms after the tone stopped.

## What this verifies
1. A power-amp IC is a microphone amplifier, and an op-amp after it adds the gain a speaker used as a microphone needs.
2. A diode pump and a comparator turn sound into a steady on/off signal that outlasts short pauses.
3. An op-amp output can switch a PNP high-side driver when a LED in the base lead keeps its high level from turning the transistor on.

## Simulation notes
The sound is a steady 400 Hz tone standing in for a voice. The motor carries a light load so it spins up in tens of milliseconds and coasts for about two seconds.

```assert
# 1 ms after switch-on (the solve assert-physics runs), silent
net potentiometer_21.wiper V 0.854 +-0.01
net lm358_7.2_out V 7.5 +-0.05
net pnp_26.base V 8.868 +-0.02
net dc_motor_27.a V 0 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 47** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-voice-motor` prints them one by one.
<!-- engine-provenance -->
