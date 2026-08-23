---
level: beginner
age: 8+
prereqs: []
teaches: [microbit, temperature, conditionals, display]
---

# Thermometer

See the temperature at a glance — the micro:bit shows a different icon
for hot, comfortable, and cold!

## What you see

The LED display shows one of three patterns that updates every 2 seconds:

- **Wavy lines** — it is warm (above 25 °C).
- **Small diamond** — comfortable (15–25 °C).
- **Large snowflake** — it is cold (below 15 °C).

## Try this

1. Flash the program to your micro:bit.
2. Watch the icon — it should show the room temperature range.
3. Hold the micro:bit near a warm cup or a cold surface and watch the
   icon change.
4. Breathe on the chip to warm it slightly.

## What is going on

The micro:bit has a temperature sensor built into its processor chip.
The program reads it every 2 seconds with `read temperature` and uses
two `IF / ELSE` blocks to pick one of three icons. Because there is no
`ELSE IF` in BrickWright, the second check is nested inside the first
`ELSE` block.

## Why it matters

Classifying a continuous value into ranges is one of the most common
tasks in embedded programming — thermostats, battery-level indicators,
and traffic-light controllers all work this way. The nested-IF pattern
shows how to implement a multi-way decision without a `switch` statement.

## Go further

- Add more ranges with finer patterns (five icons instead of three).
- Change the thresholds to match your local climate.
- Use the light sensor (`read light`) instead to make a brightness meter.
