# pc24-light-gate

## Circuit
An LDR from VCC and a 10 kΩ resistor to ground form a light-dependent divider;
the divider node drives an NPN base. Collector load is 1 kΩ + a yellow LED;
emitter to ground.

**Direction:** the LDR is the *upper* leg, so **bright light pulls the base up
and turns the LED on**; darkness lets it fall and the LED goes off. (The
program comment said the opposite until this audit.)

## Expected — physically
LDR 100 kΩ dark → 1 kΩ bright, against a 10 kΩ lower leg:

| light | R_LDR | divider node | transistor |
|---|---|---|---|
| dark (0.0) | 100 kΩ | 5 · 10/110 = 0.45 V | off, below V_be |
| mid (0.5) | 10 kΩ | 5 · 10/20 = 2.5 V, clamped to ~0.7 by the base | on |
| bright (1.0) | 1 kΩ | 5 · 10/11 = 4.5 V, clamped to ~0.7 | hard on |

Threshold at V_be ≈ 0.7 V, i.e. around R_LDR ≈ 61 kΩ. Collector should sit at
V_ce_sat with the LED at (5.0 − 2.0 − 0.2) / 1000 ≈ 2.8 mA once on.

## Measured (`audit-solve pc24-light-gate --set ldr1=<0…1>`)

| light | base | collector | LED brightness | LED current |
|---|---|---|---|---|
| 0.0 (dark) | 0.4545 V | 3.0000 V | 0.0000 | 0.000 mA |
| 0.5 | 0.7036 V | **−33.2874 V** | 0.0000 | 35.9 mA |
| 1.0 (bright) | 0.7418 V | **−419.5816 V** | 0.0000 | 418.4 mA |

**The sensing half works.** The base tracks the light from 0.4545 V to
0.7418 V and crosses V_be exactly where the divider says it should — that is
the light gate, and it is measurable.

**The switching half does not.** Same defect as pc23 and pc15: `stampNPN` has
no saturation region, so it forces β · I_b through the collector branch and the
node runs away — at full brightness to −419 V and a reported 418 mA, with the
solver logging *"Circuit did not converge"*. Escalation **E1** in
`examples/AUDIT/pc13-pc24.md`.

## Content defect fixed during the audit
The LDR declared `minOhms: 1000, maxOhms: 100000`. The device reads
**`rDark` / `rLight`** (`mna.js: stampVariableResistor`, `board.js:2151`), so
both were silently ignored and the model fell back to its own defaults of
1 MΩ dark / 100 Ω light. The declared range had no effect on anything.

Before the fix, at the reset (dark) control value the base sat at **0.0495 V**
— consistent with a 1 MΩ upper leg, not the 100 kΩ declared — and at full
brightness the 100 Ω leg drove the solver straight into non-convergence.
Renamed to `rDark: 100000, rLight: 1000`; the base now reads 0.4545 V dark, as
the declared parts say it should.
