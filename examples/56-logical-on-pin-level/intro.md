---
level: beginner
age: 9+
prereqs: [01-blink]
teaches: [logical-output, pin-level, active-low, active-high, retargeting]
---
## What you see
A single LED blinks with the same logical program on every supported microcontroller. Select an STC12 target and the generated circuit uses active-low wiring. Select a push-pull target such as an Arduino, Pico, or STM32 and it uses active-high wiring.

## Try it
1. Run the STC12 version and note that `turn on led` means a LOW pin level.
2. Pick Arduino Uno in the device selector and run the same program. The LED still turns on, but its generated bench uses a HIGH pin level.
3. Switch between more devices. Check the `PIN` declaration and follow the LED path to VCC or GND.

## What is happening
`turn on` describes the logical state you want, not a universal voltage. An `ACTIVE LOW` output is on at LOW and normally uses a VCC → resistor → LED → pin path. An active-high output is on at HIGH and normally uses a pin → resistor → LED → GND path. The retargeter changes the pin name, polarity declaration, and generated wiring together, so the program body does not change.

The electrical choice depends on the target's output stage. The STC12 lessons use its asymmetric quasi-bidirectional model; push-pull targets can source the generated LED load directly. This lesson makes no claim that different chips produce identical current or brightness.

## Why it matters
Separating intent from voltage prevents a common portability bug. Code can say “LED on” consistently while a board support layer handles whether that means zero volts or the supply voltage.

## Next
- [06-active-low-high](../06-active-low-high) — compare both paths on the STC12 model.
- [32-source-vs-sink](../32-source-vs-sink) — see why the STC12 prefers its sink direction.
- Experiment: retarget the program, then predict the `PIN` polarity before opening the generated circuit.
