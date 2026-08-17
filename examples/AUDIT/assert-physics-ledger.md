# Absolute-Physics Assertion Ledger

Machine-checkable physics values in EXPECTED.md `assert` blocks.
Runner: `test/assert-physics.test.mjs` — parses ```assert blocks, solves
circuits headless, checks measured vs expected with stated tolerances.

## Seeded examples (15)

| # | example | assertion | physics basis |
|---|---|---|---|
| 1 | 21-resistor-led | R1.b = 2.13V +-0.15 | Ohm's law + Shockley LED Vf at 13mA |
| 2 | 34-ohms-law | R1.b = 2.03V +-0.15 | Ohm's law + Shockley at 3mA |
| 3 | 37-voltage-divider-basic | R1.b = 2.50V +-0.01 | Equal divider: VCC×R2/(R1+R2) |
| 4 | pc01-led-resistor | vsource = 5.00V +-0.01 | Supply rail |
| 5 | pc02-voltage-divider | vsource = 9.00V +-0.01 | Battery source |
| 6 | pc04-parallel-leds | vsource = 5.00V +-0.01 | Supply rail |
| 7 | pc13-direct-diode | R.b = 2.89V, diode.cathode = 2.10V | Series Kirchhoff |
| 8 | pc18-zener-clamp | R.b = 5.14V +-0.20 | Zener breakdown |
| 9 | pc30-resistor-ladder | taps = 6.00V, 3.00V +-0.01 | Three equal R |
| 10 | pc34-polarity-protector | d1.cathode = 8.24V +-0.20 | Diode forward drop from 9V |
| 11 | pc37-selectable-reference | taps = 6.00V, 3.00V +-0.01 | Three equal R |
| 12 | pc41-zener-reference | R.b = 5.12V +-0.20 | Zener breakdown |
| 13 | pc42-parallel-paths | src = 9.00V +-0.01 | Supply rail |
| 14 | pc49-diode-clamp | R.b = 0.74V +-0.10 | Diode Vf (Shockley) |
| 15 | pc54-opamp-follower | wiper = out = 2.50V +-0.01 | Unity gain buffer |

## Examples that CANNOT be asserted yet and why

| category | count | reason |
|---|---|---|
| Breadboard-seated pure circuits | ~80 | Circuit.fromJSON resolves breadboard fabric but net labels differ from part.terminal — needs net-label aliasing in the runner |
| MCU examples (duty cycle) | ~60 | Need multi-step simulation with pin-edge tracking; `pin-duty` assertion kind exists but is skipped pending the driver |
| Frequency assertions (555 timers) | ~15 | Need oscillation measurement over multiple cycles; `frequency` kind exists but skipped |
| Current assertions | ~20 | Need branch-current readback from the engine; `current` kind exists but skipped |
| Retro CPU examples | ~10 | Engine cannot model w65c02/z80 parts |
| Arduino CC0 examples | ~30 | Programs are porting-in-progress; assertions depend on program correctness |

## Continuation ladder

- Next 15: dimmer ratio, thermostat threshold, 555 period, LCD text, matrix duty
- Then: wire multimeter-chain emulator tests for 74-ammeter, 75-battery-tester
- Eventually: every pure-circuit example should have at least one `net V` assertion
