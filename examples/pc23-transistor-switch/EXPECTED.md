# pc23-transistor-switch

## Circuit
VCC → push button → 10 kΩ → NPN base. Separately, VCC → 470 Ω → red LED →
NPN collector; emitter to ground. Closing the button supplies base current and
the transistor turns the LED on.

## Expected — physically
- Button open: no base current, transistor off, LED dark.
- Button closed: I_b = (5.0 − 0.7) / 10 000 = **0.43 mA**. β · I_b = 43 mA is
  more than the collector branch can pass — (5.0 − 2.0 − 0.2) / 470 ≈
  **6.0 mA** — so the transistor saturates, V_ce ≈ 0.2 V, LED lit at ~6 mA.

## Measured (`audit-solve pc23-transistor-switch`)

Button open (quiescent):

| node | volts |
|---|---|
| base | 0.0050 V |
| collector | 4.4970 V |
| LED anode | 5.0000 V |
| emitter | 0.0000 V |

LED dark, transistor off. Correct.

## Content defect fixed during the earlier audit
`circuit.json` originally carried a wire from `button1.b` straight to
`gnd1.gnd`, in addition to the one from `button1.b` to `rb.a`. That tied the
whole base-drive node to ground: the base sat at 0.0000 V with the button open
**and closed**, so the button was inert. The wire was removed.
