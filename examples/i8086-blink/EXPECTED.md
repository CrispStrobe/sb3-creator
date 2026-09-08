# i8086-blink — expected behaviour

## Circuit

An Intel 8086 CPU and an 8255 PPI on the bus; eight LEDs (each through a 220 Ω resistor) on the 8255's port B, `P2.0`–`P2.7`. Circuit provenance: bw-circuit-ui's `gallery/reseat/e4-reseated-8086.json`, adapted to the gallery shape.

## Program

`DEVICE i8086`, `PIN led = P2.0 OUTPUT`. A forever loop toggles `P2.0` at 1 Hz: 500 ms on, 500 ms off.

## Observable behaviour

LED 0 (on `P2.0`) blinks at 1 Hz. LEDs 1–7 (`P2.1`–`P2.7`) stay off — they are the rest of the port, unused by this program.
