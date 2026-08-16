# arduino-sk-p12-knock-lock — expected behaviour

## Circuit

Arduino Uno A0 <- piezo sensor. D2 <- button with pull-down. D3 → red LED. D4 → yellow LED. D5 → green LED. D9 → servo.

## Program

Starts locked (red LED on). Detects knocks on piezo (threshold 100). After 3 valid knocks, unlocks: red LED off, green LED on, servo moves. Button press re-locks.

## Observable behaviour

- **Locked state:** red LED (D3) is **ON**, green LED (D5) is OFF.
- **Knock detected:** yellow LED (D4) flashes briefly as feedback.
- **After 3 knocks:** system **unlocks** — red LED OFF, green LED ON, servo moves to open position.
- **Button pressed while unlocked:** system **re-locks** — green OFF, red ON, servo returns.
- Serial prints knock count and lock/unlock events.

## What this verifies

1. Piezo knock detection with threshold
2. Counter-based unlock logic (3 knocks required)
3. Multi-output coordination: LEDs, servo, and serial
