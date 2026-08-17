# 27-led-dice -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm resistor -> red LED (Vf = 2.0 V) -> MCU P1.0 (active-low).
Button on P3.2 with 10 kOhm pull-up to VCC; button press connects P3.2 to GND.

## Program

1. Variable `roll` starts at 1 and cycles 1-2-3-4-5-6-1-... in a tight loop
   while the button is held down.
2. On release, the final value of `roll` is effectively random (depends on
   hold duration at microsecond resolution).
3. LED blinks `roll` times (300 ms on, 300 ms off) to display the result.
4. Pauses 1 second before the next round.

## Observable behaviour

| phase          | P1.0 level | LED state   | duration             |
|----------------|------------|-------------|----------------------|
| idle           | high (1)   | OFF         | until btn press      |
| counting       | high (1)   | OFF         | while btn held       |
| pause          | high (1)   | OFF         | 300 ms               |
| result blinks  | toggling   | blinking    | roll x 600 ms        |
| cooldown       | high (1)   | OFF         | 1 s                  |

- **Roll range:** 1 to 6
- **Blink period:** 600 ms (300 ms on + 300 ms off)
- **Max display time:** 6 x 600 ms = 3.6 s
- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. REPEAT UNTIL with a pin-read condition (button release detection)
2. Variable wrapping with IF/THEN (modulo-like cycling 1-6)
3. REPEAT with a variable count to display a numeric result
4. Pseudo-random outcome from high-speed counter sampling

```assert
# Button pull-up at VCC, MCU supply
net BTN_btn.a V 5.00 +-0.01
net MCU.VCC V 5.00 +-0.01
```
