# pc17-current-compare — three LEDs, three resistors

## Circuit
Three parallel branches off one 5 V supply, each a resistor in series with an
LED: 220 Ω + red, 470 Ω + green, 1 kΩ + blue. The branches share only the
supply and the return.

## Expected (measured, `audit-solve pc17-current-compare`)

| branch | LED anode | current | brightness |
|---|---|---|---|
| 220 Ω, red | 2.1304 V | **13.04 mA** | **0.6522** — brightest |
| 470 Ω, green | 2.0625 V | **6.25 mA** | **0.3125** |
| 1 kΩ, blue | 2.0297 V | **2.97 mA** | **0.1485** — dimmest |

Supply total: 22.26 mA. No DRC warnings — the brightest branch is at 13 mA,
under the 20 mA rating.

Double the resistance, halve the current: 220 → 470 is roughly ×2 and 13.04 →
6.25 mA is roughly ÷2; 470 → 1000 likewise. The proportionality is not exact
because the LED's own drop rises with current (2.030 V at 3 mA, 2.130 V at
13 mA), so the voltage left for the resistor is not quite constant.

## Note on the ideal-drop estimate
Assuming a flat 2.0 V LED gives 13.6 / 6.4 / 3.0 mA — 2–4 % high in every
branch, for the reason above. The brightness figures are exact.

## Try it
Change the 1 kΩ to 2.2 kΩ. Only the blue branch dims; the other two do not
move at all. Parallel branches do not share.
