---
level: beginner
age: 8+
prereqs: [06-active-low-high]
teaches: [source-current, sink-current, wiring-conventions]
---

## What you see

Two LEDs are wired to the same MCU pin but in opposite ways. One LED is
connected from the pin to ground (source wiring: current flows out of the pin).
The other is connected from VCC to the pin (sink wiring: current flows into the
pin). When the pin goes high, the source-wired LED lights and the sink-wired LED
goes dark. When the pin goes low, the opposite happens.

## Try this

1. Click **Sim**. One LED is on and the other is off.
2. Wait for the pin to toggle. The LEDs swap -- the one that was on goes off,
   and the one that was off comes on.
3. Look at the current readings for each LED. On most microcontrollers the
   sink current capacity is slightly higher than the source capacity, which is
   why active-low (sink) wiring is more common in practice.

## What is going on

A microcontroller pin can push current out (source) or pull current in (sink).
In source mode, the pin is high and current flows through the LED to ground. In
sink mode, the pin is low and current flows from VCC through the LED into the
pin. Both work, but they light the LED on opposite logic levels. The
active-low convention (LED on when pin is low) uses sink mode and is standard
on most development boards because the pin can typically sink more current
than it can source.

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
- **Experiment:** measure the exact current in source and sink mode with the
  same resistor value. On an STC12, the difference is small but measurable --
  the pin driver is not perfectly symmetric.
