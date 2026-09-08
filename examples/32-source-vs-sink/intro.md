---
level: beginner
age: 8+
prereqs: [06-active-low-high]
teaches: [source-current, sink-current, wiring-conventions]
---

## What you see

Two LEDs use two adjacent MCU pins and the same resistor value. One LED is
connected from its pin to ground (source wiring: current flows out of the pin).
The other is connected from VCC to its pin (sink wiring: current flows into the
pin). The program turns both on continuously: P1.0 stays LOW to sink current,
while P1.1 stays HIGH to source it.

## Try this

1. Click **Sim**. The sink-wired LED is bright and the source-wired LED is dim.
2. Inspect both pin levels: P1.0 is LOW and P1.1 is HIGH; neither toggles.
3. Compare the LED brightness. This large difference is the STC12's default
   quasi-bidirectional output behaviour, not a claim about most GPIO families.

## What is going on

A microcontroller pin can push current out (source) or pull current in (sink).
In source mode, the pin is high and current flows through the LED to ground. In
sink mode, the pin is low and current flows from VCC through the LED into the
pin. Both work, but they light the LED on opposite logic levels. The
active-low convention (LED on when pin is low) uses sink mode. It matters
especially on this STC12 because its default quasi-bidirectional HIGH is a weak
pull-up, whereas its LOW path is a strong sink. Push-pull GPIO can be nearly
symmetric and belongs in the separate portable polarity lesson.

## Why it matters

Understanding source vs. sink wiring prevents the most common beginner mistake:
wiring an LED and finding it lights up when you expected it to be off, and goes
dark when you expected it on. It also matters when you connect to external
driver chips, relays, or optocouplers, which often expect a specific polarity.

## Go further

- **The logic behind it:** [06-active-low-high](../06-active-low-high) --
  active-low and active-high logic explained.
- **When overcurrent matters:**
  [31-no-resistor-led](../31-no-resistor-led) -- exceeding the pin's current
  rating.
- **Experiment:** compare both LED brightness values without changing the
  program. On this STC12 the source/sink difference is large and visible.
