# arduino-sk-p07-keyboard — expected behaviour

## Circuit

Arduino Uno D2, D3, D4, D5 <- four pushbuttons with pull-downs. D8 → buzzer → GND.

## Program

Each button plays a different note: D2 = C4 (262 Hz), D3 = D4 (294 Hz), D4 = E4 (330 Hz), D5 = F4 (349 Hz). When no button is pressed, the buzzer is silent.

## Observable behaviour

- **No buttons pressed:** buzzer is **silent**.
- **Button on D2:** buzzer plays **262 Hz** (C4).
- **Button on D3:** buzzer plays **294 Hz** (D4).
- **Button on D4:** buzzer plays **330 Hz** (E4).
- **Button on D5:** buzzer plays **349 Hz** (F4).
- Press multiple buttons: the last-checked active button determines the pitch.

## What this verifies

1. Four-key input -> four distinct tones
2. `set tone speaker to` with different frequencies per button
3. Buzzer silence when no button is pressed

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
