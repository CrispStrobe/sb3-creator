---
level: intermediate
age: 12+
prereqs: [pc55-ntc-indicator, pc05-npn-switch]
teaches: [temperature-sensing, thermistor, bias, transistor-switch]
---
## What you see
A green LED that means "everything is fine". Warm up the thermistor and the LED goes out.

## Try this
1. Click **Sim**. The LED is on.
2. Slowly raise the temperature slider on the thermistor. Somewhere around the middle the LED switches off.
3. Turn the trimmer and try again. Does it now switch earlier or later?

## What is going on
The thermistor and the trimmer form a voltage divider for the base of the first transistor. When the thermistor warms up its resistance drops, the base voltage rises, and at about 0.7 V the first transistor starts to conduct. It then pulls the base of the second transistor to ground, taking away the current that kept the LED on. In a real kit you would warm the first transistor itself with your fingers — every silicon junction changes its voltage by about 2 mV per degree.

## Go further
- [pc55-ntc-indicator](../pc55-ntc-indicator) — a thermistor driving an LED directly.
- [lab-battery-threshold](../lab-battery-threshold) — the same threshold idea with a battery.
