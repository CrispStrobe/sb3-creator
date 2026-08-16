# pc64-555-retrigger — expected behaviour

## Circuit
555 monostable. R_t = 100 kΩ, C_t = 10 µF. Trigger pulled HIGH via 10 kΩ. Button grounds trigger. Output → 1 kΩ → red LED → GND.

## Observable behaviour
- **Button pressed:** output HIGH for t = 1.1 × 100k × 10µ = 1.1 s.
- LED current during pulse: (4 − 2) / 1000 = 2 mA.
- **Retriggered during pulse:** timer restarts, LED stays on for another 1.1 s from the retrigger.
- **No retrigger:** LED off after 1.1 s.

## What this verifies
1. Monostable pulse duration: t = 1.1 × R × C = 1.1 s
2. Retriggering extends the pulse by restarting the capacitor charge
3. Pulse duration is independent of trigger pulse width
