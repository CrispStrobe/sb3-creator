# sense-clap-switch -- expected behaviour

## Circuit

- Sound module: VCC and GND from the rails, its digital output `do` straight
  to MCU P3.2. The module drives `do` HIGH while the sound level is at or above
  its threshold and LOW below it, so there is no pull-up.
- VCC (5 V) -> 1 kOhm -> LED `lamp` (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

Waits for `do` to go HIGH, toggles the lamp, waits for `do` to go LOW again,
then ignores the input for 300 ms before listening for the next clap.

## Observable behaviour

| event                         | P3.2 | lamp            |
|-------------------------------|------|-----------------|
| quiet                         | LOW  | unchanged       |
| 1st clap                      | HIGH | ON              |
| 2nd clap                      | HIGH | OFF             |
| one long loud noise           | HIGH | toggles ONCE    |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. Reading a sound module's digital output
2. Edge handling: one loud event toggles once, however long it lasts
3. A dead time after each event to ignore echoes

```assert
# Quiet room at start: the module holds DO, and the pin, at 0 V.
net SOUND_clap.do V 0.00 +-0.01
net MCU.P3.2 V 0.00 +-0.01
```
