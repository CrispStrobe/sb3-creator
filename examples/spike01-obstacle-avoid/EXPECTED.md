# spike01-obstacle-avoid — expected behaviour

## Program
A simple obstacle-avoidance loop. Motor A drives forward continuously.
A distance sensor on port B checks for obstacles. When an object is
closer than 15 cm, the robot stops, shows "!" on the hub display, backs
up for 0.5 seconds, then resumes forward.

## Expected block opcodes (SB3)
- `spikeprime_motorStart` (PORT=A, DIRECTION=forward)
- `spikeprime_getDistance` (PORT=B) — reporter in condition
- `spikeprime_motorStop` (PORT=A)
- `spikeprime_displayText` (TEXT="!")
- `spikeprime_displayClear`
- `spikeprime_motorStart` (PORT=A, DIRECTION=backward)

## What this verifies
1. Motor start/stop round-trips through sb3
2. Distance sensor reporter wired as an input to a condition
3. Display text and clear commands
4. Direction field values (forward/backward) preserved
5. FOREVER loop + IF/THEN structure with spike blocks inside
