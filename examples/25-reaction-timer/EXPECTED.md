# 25-reaction-timer -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm resistor -> green LED (Vf = 2.0 V) -> MCU P1.0 (active-low).
Button on P3.2 with 10 kOhm pull-up to VCC; button press connects P3.2 to GND.

## Program

1. LED off. Wait a fixed delay (30 x 100 ms = 3 seconds).
2. Turn LED on and start counting in 1 ms increments.
3. When button is pressed (P3.2 goes LOW), stop counting.
4. Blink the LED `counter` times to display the reaction time.
5. Wait 2 seconds, then repeat.

## Observable behaviour

| phase           | P1.0 level | LED state | duration         |
|-----------------|------------|-----------|------------------|
| waiting         | high (1)   | OFF       | 3 s              |
| stimulus on     | low (0)    | ON        | until btn press  |
| result blinks   | toggling   | blinking  | counter x 200 ms |
| pause           | high (1)   | OFF       | 2 s              |

- **Counter resolution:** ~1 ms per count
- **Example:** 250 ms reaction time = counter reaches ~250, LED blinks 250 times
- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Pull-up current (idle):** 5.0 / 10000 = 0.5 mA

## What this verifies

1. REPEAT UNTIL with a pin-read condition for event detection
2. Variable as a counter incrementing in a tight loop
3. Using REPEAT with a variable to display a measured value
4. Sequencing multiple phases with different timing

```assert
# Button open: pull-up holds input at VCC = 5.000V
net R_PU_btn.b V 5.00 +-0.01
```
