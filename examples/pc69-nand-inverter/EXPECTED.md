# pc69-nand-inverter — expected behaviour

## Circuit
NAND gate (2-input) with both inputs tied together. Switch + 10 kΩ pull-down on input. Output → 1 kΩ → red LED → GND.

## Observable behaviour
- **Switch OFF (input LOW):** NAND(0,0) = 1. Output HIGH. LED ON.
  LED current: (5 − 2) / 1000 = 3 mA.
- **Switch ON (input HIGH):** NAND(1,1) = 0. Output LOW. LED OFF.
- The circuit inverts: input LOW → output HIGH, input HIGH → output LOW.

## What this verifies
1. NAND with tied inputs = NOT (inverter)
2. NAND is a universal gate — every logic function can be built from it
3. Pull-down resistor defines the default (LOW) input state
