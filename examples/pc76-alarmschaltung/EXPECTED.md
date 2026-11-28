# pc76-alarmschaltung — expected behaviour

## Circuit
Two NOR gates cross-coupled (SR latch). The alarm switch drives gate 2, so pressing it pulls the complementary output low and sets Q high. The reset button drives gate 1 and forces Q low. Both inputs have 100 kΩ pull-downs. The Q output drives the buzzer through 100 Ω.

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

```assert
# NOR SR latch alarm: set -> buzzer on, persists until reset
net vcc_1.pos V 5.00 +-0.01
```
