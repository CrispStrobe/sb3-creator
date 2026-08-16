# pc63-555-bistabil — expected behaviour

## Circuit
VCC (5 V) → 555 timer (bistable mode). Set button grounds trigger (pin 2). Reset button drives threshold (pin 6) to VCC. Output → 1 kΩ → green LED → GND.

## Observable behaviour
- **No buttons pressed:** output holds last state. LED stays on or off.
- **Set pressed:** output goes HIGH (≈ VCC − 1 V ≈ 4 V). LED current ≈ (4 − 2) / 1000 = 2 mA. LED ON.
- **Reset pressed:** output goes LOW (≈ 0.2 V). LED OFF.
- The 555 remembers the state — no timing components needed.

## What this verifies
1. 555 bistable mode: trigger sets, threshold resets, no RC timing
2. Output drives an LED through a current-limiting resistor
3. State memory without software
