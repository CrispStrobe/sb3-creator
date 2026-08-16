# pc76-alarmschaltung — expected behaviour

## Circuit
Two NOR gates cross-coupled (SR latch). Alarm switch → set input (NOR gate 1 in0) with 100 kΩ pull-down. Reset button → reset input (NOR gate 2 in1) with 100 kΩ pull-down. Q output → 100 Ω → buzzer.

## Observable behaviour
- **Idle:** both inputs LOW. Latch holds Q = LOW. Buzzer silent.
- **Alarm switch activated (HIGH):** Q goes HIGH. Buzzer sounds.
- **Alarm switch released:** Q stays HIGH (latch holds). Buzzer continues.
- **Reset pressed:** Q goes LOW. Buzzer stops.
- The latch remembers the alarm — it persists until manually reset.

## What this verifies
1. NOR SR latch: S sets Q HIGH, R resets Q LOW
2. Alarm persists after trigger is released — memory without software
3. 100 Ω limits buzzer current from gate output
