# pc66-555-langzeit — expected behaviour

## Circuit
555 monostable. R_t = 1 MΩ, C_t = 100 µF. Trigger pulled HIGH via 10 kΩ. Button grounds trigger. Output → 1 kΩ → yellow LED → GND.

## Observable behaviour
- **Button pressed:** LED lights for t = 1.1 × 1M × 100µ = 110 s ≈ 1 min 50 s.
- LED current: (4 − 2) / 1000 = 2 mA.
- **After 110 s:** LED turns off automatically.
- The long pulse comes from large R × C, not from any special 555 mode.

## What this verifies
1. Long monostable pulse: t = 1.1 × 1 MΩ × 100 µF = 110 s
2. Same formula as short pulses — only component values differ
3. Practical long-duration timer without software
