---
level: advanced
age: 14+
prereqs: [pc06-rc-charge]
teaches: [555-timer, monostable, pulse-generation]
---
## What you see
A 555 timer in monostable (one-shot) mode. Pressing the trigger button starts a single timed pulse — the LED lights for a duration set by the resistor and capacitor, then turns off automatically.

## Try this
1. Click **Sim** — the LED is dark (timer idle, output low).
2. Press the trigger button. The LED lights up and the capacitor begins to charge.
3. After the pulse duration (t ≈ 1.1 × R × C), the LED turns off and the timer resets. The capacitor discharges through the timer's internal transistor.

## What is going on
The 555 timer uses an internal comparator to watch the capacitor voltage. When triggered, it sets its output high and lets the capacitor charge through the timing resistor. When the capacitor reaches 2/3 of VCC, the comparator flips, the output goes low, and the internal discharge transistor pulls the capacitor to ground. The pulse duration is t = 1.1 × R × C, independent of the supply voltage.

## Why it matters
The 555 timer is one of the most widely used ICs ever made — billions have been produced since 1972. In monostable mode it generates precise time delays for debouncing, pulse stretching, and triggering other circuits. Understanding its RC timing is the key to using it in any configuration.

## Go further
- [pc06-rc-charge](../pc06-rc-charge) — the RC charging curve that drives the timing.
- [pc27-timer-pulse](../pc27-timer-pulse) — another timer pulse circuit.
- Experiment: double the capacitor value and verify that the pulse duration doubles.
