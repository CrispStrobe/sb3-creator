# pc23-transistor-switch

## Circuit
VCC → push button → 10 kΩ → NPN base. Separately, VCC → 470 Ω → red LED →
NPN collector; emitter to ground. Closing the button supplies base current and
the transistor should turn the LED on.

## Expected — physically
- Button open: no base current, transistor off, LED dark.
- Button closed: I_b = (5.0 − 0.7) / 10 000 = **0.43 mA**. β · I_b = 43 mA is
  more than the collector branch can pass — (5.0 − 2.0 − 0.2) / 470 ≈
  **6.0 mA** — so the transistor saturates, V_ce ≈ 0.2 V, LED lit at ~6 mA.

## Measured (`audit-solve pc23-transistor-switch [--set button1=1]`)

| node | button open | button closed |
|---|---|---|
| base | 0.0050 V | **0.7043 V** |
| collector | 4.4970 V | **−17.6194 V** |
| LED anode | 5.0000 V | −15.1898 V |
| LED brightness | 0.0000 | 0.0000 |
| LED current | 0.000 mA | 42.957 mA (DRC: exceeds 20 mA) |

**The base half works and the collector half does not.** Pressing the button
moves the base from 5 mV to 0.7043 V and draws the designed 0.43 mA — that
much is correct, and it is new: before this audit the base node was wired
directly to ground (see below) and did not move at all.

The collector reading is the engine defect. 42.957 mA is β · I_b to three
decimal places; `stampNPN` (`bw-board/src/mna.js:1278`) stamps I_c = β · I_b as
an unconditional current source with no V_ce_sat floor and no saturation
region, so rather than clamping it drags the collector to −17.6 V to force a
current the loop cannot carry. Escalation **E1** in
`examples/AUDIT/pc13-pc24.md`.

## Content defect fixed during the audit
`circuit.json` carried a wire from `button1.b` straight to `gnd1.gnd`, in
addition to the one from `button1.b` to `rb.a`. That tied the whole base-drive
node to ground: the base sat at 0.0000 V with the button open **and closed**,
so the button was inert and closing it would have shorted VCC to ground. The
wire is removed; the numbers above are after that removal.

The circuit is otherwise left alone. Choosing a base resistor that keeps
β · I_b below the load current would make the readout look right, but only by
avoiding the region the example is about.
