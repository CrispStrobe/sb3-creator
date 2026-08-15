---
level: intermediate
age: 12+
prereqs: [37-voltage-divider-basic]
teaches: [voltage-measurement, battery-monitoring, scaling]
---
## What you see
A voltage divider that scales a battery voltage down to a range safe for an MCU's ADC input. A 9 V or 12 V battery is too high for a 3.3 V or 5 V microcontroller to read directly, so two resistors divide the voltage to fit within the ADC's range.

## Try this
1. Run the simulation and read the divided voltage at the midpoint — it should be within the MCU's safe input range.
2. Change the battery voltage and observe the midpoint tracking proportionally.
3. Calculate the original battery voltage from the divided voltage using the resistor ratio, and confirm it matches.

## What is going on
The voltage divider outputs Vout = Vbat * R2 / (R1 + R2). By choosing the right ratio, you ensure Vout never exceeds the MCU's maximum ADC input (typically 3.3 V or 5 V), even at the battery's full charge voltage. The MCU reads Vout with its ADC and calculates Vbat using the known ratio. High-value resistors (100 kohm range) keep the divider current low so it does not drain the battery. This is exactly how battery gauges in phones and laptops work.

## Why it matters
Monitoring battery voltage is essential for any portable device — it tells you when to warn the user, when to save data, and when to shut down safely. The voltage divider is the standard method because it is passive, reliable, and costs almost nothing.

## Go further
- [37-voltage-divider-basic](../37-voltage-divider-basic) — understand the unloaded divider before adding a battery.
- [39-zener-clamp](../39-zener-clamp) — add overvoltage protection to the divider output for extra safety.
- Experiment: design a divider that maps 0-12 V to 0-3.3 V, calculate the resistor values, and verify the maximum output stays under 3.3 V.
