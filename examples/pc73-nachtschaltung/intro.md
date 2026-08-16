---
level: intermediate
age: 12+
prereqs: [pc72-tagschaltung]
teaches: [LDR, transistor-switch, voltage-divider, night-light]
---
## What you see
A night switch: the LED lights in darkness. The LDR and fixed resistor are swapped compared to the daytime switch — in the dark the LDR goes high resistance, the voltage at the divider point rises, and the transistor turns the LED on.

## Try this
1. Click **Sim** — with a dark LDR value the LED is on.
2. Change the LDR value to bright — the LED turns off.
3. The only difference from the [daytime switch](../pc72-tagschaltung) is the position of the LDR and resistor in the voltage divider.

## What is going on
In the divider the fixed resistor is at the top (VCC side) and the LDR is at the bottom (GND side). In darkness the LDR is high resistance, nearly all the voltage drops across it, the divider point is high, and the transistor conducts.

## Go further
- [pc72-tagschaltung](../pc72-tagschaltung) — the complementary circuit (LED on when bright).
- [pc60-night-lamp-hardware](../pc60-night-lamp-hardware) — another hardware night light.
