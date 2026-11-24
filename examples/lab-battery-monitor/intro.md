---
level: advanced
age: 14+
prereqs: [lab-pnp-npn-relax]
teaches: [relaxation-oscillator, threshold, battery-monitor, peak-point-current]
---
## What you see
The PNP-NPN flasher again, on an adjustable supply instead of a battery, with a "set" knob in the divider that holds the PNP's base. At 9 V the red LED flashes about three times a second.

## Try this
1. Click **Sim** and watch the flashes.
2. Turn the supply down slowly, in quarter-volt steps, and give it a moment after each step. At what voltage does the LED stop?
3. Turn the set knob down a little. Does it flash again? How far can you now lower the supply?
4. Turn the set knob up to 0.8 and the supply back to 9 V. What do you need to do to make it flash?

## What is going on
The capacitor charges through a large resistor and the pair fires when it passes the PNP's base voltage. To fire, though, the pair needs a small push: a few microamps still flowing into the capacitor at that moment. That current comes from the difference between the supply and the trigger point. The divider puts the trigger point at a fixed share of the supply, so the difference shrinks with the supply, and below a certain voltage it is too small. The capacitor then creeps up to just under the trigger point and waits there forever. A higher share on the set knob means a smaller gap, so you need more volts before it flashes. Set the knob so it just flashes on a fresh battery and stops when the battery is tired, and you have built a battery monitor.

## Go further
- [lab-pnp-npn-relax](../lab-pnp-npn-relax) — the same pair with a fixed divider and a rate knob.
- [lab-relax-tone](../lab-relax-tone) — the same pair, a thousand times faster: a tone.
