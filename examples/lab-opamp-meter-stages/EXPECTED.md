# lab-opamp-meter-stages — expected behaviour

## Circuit
- 9 V supply; LM324 section 4 buffers a midpoint at half the supply.
- ×10 stage (section 1, 91 kΩ / 10 kΩ) for small voltages against the midpoint; its + input hangs on 1 MΩ to the midpoint. isource_8 (45 nA into the input) is the bias current a real LM324 drives out of its input: the engine's op-amp has none of its own, so the bench draws it. ZERO (potentiometer_9, as built at half) feeds an opposing current through 10 MΩ. PROBE (button_11) connects a source of about fifty millivolts (330 Ω) to the input. Voltmeter_16 reads output minus midpoint.
- Ammeter (section 2): the circuit under test is a 4.5 V source driving 47 Ω and a 10 Ω sensing resistor; POLARITY (slide_switch_19) connects it the right way (left) or backwards (right). The sensing voltage reaches the + input through 10 kΩ, a 1N34A germanium diode from ground clamps it; gain ×5 (40 kΩ / 10 kΩ) onto voltmeter_26 (one volt per 20 mA).

## Observable behaviour
- Nothing connected: the ×10 meter shows +0.41 V: 45 nA through 1 MΩ ‖ 10 MΩ is 41 mV at the input, times ten.
- ZERO turned to 0.45: the meter reads 0.00 V. PROBE then reads 0.49 V for the 50 mV source.
- Ammeter: 0.786 V across 10 Ω (79 mA), 3.93 V on its meter.
- POLARITY reversed: −0.79 V would reach the op-amp's input; the diode holds it at −0.19 V (60 µA through the 10 kΩ) and the meter simply reads zero.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: offset 40.9 mV at the input, 0.413 V on the meter; nulled 0.000 V; probe 0.494 V; ammeter 3.93 V; reversed input −0.192 V, diode current 59.6 µA, meter 0.005 V.

## What this verifies
1. An input bias current through a high source resistance is an offset voltage, and the stage's gain multiplies it.
2. A current of the opposite sign from the ZERO pot cancels it.
3. A series resistor and a diode keep an op-amp input within a few tenths of a volt of its supply when the measured voltage has the wrong sign.

## Simulation notes
The engine's op-amp model has no input bias or offset; isource_8 makes the bias current explicit at the LM324's typical value. A real chip's own offset voltage (a few millivolts) would add to it and the ZERO pot would take that out too.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_4.4_out V 4.5 +-0.005
net lm324_4.1_pos V 4.541 +-0.003
net voltmeter_16.a V 4.913 +-0.01
net lm324_4.2_pos V 0.786 +-0.005
net voltmeter_26.a V 3.93 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **30 of this page's 38** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-meter-stages` prints them one by one.
<!-- engine-provenance -->
