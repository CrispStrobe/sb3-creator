# pc20-rgb-mix — colour mixing with three LEDs

## Circuit
Three parallel branches off one 5 V supply: 330 Ω + red, 330 Ω + green,
470 Ω + blue. Three **discrete** LEDs sitting side by side — not a
single-package RGB LED (see the note at the end).

## Expected (measured, `audit-solve pc20-rgb-mix`)

| branch | LED anode | current | brightness |
|---|---|---|---|
| 330 Ω, red | 2.0882 V | **8.82 mA** | **0.4412** |
| 330 Ω, green | 2.0882 V | **8.82 mA** | **0.4412** |
| 470 Ω, blue | 2.0625 V | **6.25 mA** | **0.3125** |

Supply total: 23.9 mA. No DRC warnings.

Red and green are matched to the last decimal — identical resistor, identical
LED model, and parallel branches that never interact. Blue is deliberately run
about 30 % lower: it is the channel a real builder pulls back, because blue and
white LEDs read as brighter to the eye at the same current.

The ideal-drop estimate (5.0 − 2.0) / 330 = 9.1 mA is 3 % high; the LED's real
drop at 9 mA is 2.088 V.

## Note — why there is no `rgb_led` part here
The gallery title said "RGB LED" while the canvas showed three separate LEDs.
The engine has an `rgb_led` kind declared, but it is a **composite with no
model**: `validate.js:51` marks it `null // composite`, `mna.js:578` lists it
under "handled elsewhere or composite" and stamps nothing, and no expansion
into `<id>_r` / `_g` / `_b` sub-LEDs exists for `rgbLedBrightness()` to read.
Wired up, it passes 5 V straight through with no drop and no current —
measured, not assumed. So the title was corrected to match the circuit rather
than the circuit rebuilt around a part that does not conduct. Recorded as
escalation E3 in `examples/AUDIT/pc13-pc24.md`.
