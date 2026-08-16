# pc71-nand-entpreller — expected behaviour

## Circuit
Two NAND gates cross-coupled (SR latch). Set and Reset buttons pull respective inputs LOW via 10 kΩ pull-ups. Q output (gate 1) → 1 kΩ → green LED → GND.

## Observable behaviour
- **Set pressed (input LOW):** Q goes HIGH. LED ON. I = (5 − 2) / 1000 = 3 mA.
- **Set released:** LED stays ON (latch holds).
- **Reset pressed:** Q goes LOW. LED OFF.
- **Reset released:** LED stays OFF.
- Contact bounce on either button cannot flip the latch — only the first edge matters.

## What this verifies
1. NAND SR latch: S̄ active-low set, R̄ active-low reset
2. Latch holds state after button release — eliminates bounce
3. Cross-coupling: Q of gate 1 feeds gate 2, Q̄ of gate 2 feeds gate 1
