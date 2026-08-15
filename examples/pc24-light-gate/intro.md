---
level: advanced
age: 12+
prereqs: [pc23-transistor-switch, pc02-voltage-divider]
teaches: [ldr, sensor-divider, threshold, base-bias]
---

## What you see

A light-dependent resistor (LDR) running from the 5 V rail down to a 10 kΩ
resistor, which goes to ground. The point where they meet is wired to the base
of an NPN transistor, and the transistor switches a yellow LED. There is a
slider for the light level — this circuit is meant to be *moved*, not just
looked at.

> **Known defect (2026-08-15):** the LED half of this example does not work
> yet — the simulation engine has no saturation model for the NPN, so once the
> transistor turns on the collector runs away instead of switching. The
> **sensing** half is correct and measurable, and that is the half the steps
> below use. See `examples/AUDIT/pc13-pc24.md`.

## Try this

1. Set the light slider to **0** (dark) and read the voltage at the base. About
   **0.45 V**.
2. Slide it to **1** (bright) and read again: about **0.74 V**.
3. That is the whole range — less than 0.3 V — and the transistor's threshold
   sits inside it, at about 0.7 V. So somewhere in the middle of the slider's
   travel, the circuit changes its mind.
4. Find that point by feel: try 0.1, then 0.2, then 0.3, watching the base
   voltage cross 0.70 V.
5. Now change the 10 kΩ resistor to **2.2 kΩ** and repeat step 4. The crossing
   point moves, because you changed where in the LDR's range the divider
   balances.

## What is going on

An LDR is a resistor that gets *smaller* when light falls on it. This one runs
from about 100 kΩ in the dark down to about 1 kΩ in bright light — a hundred to
one. But a transistor cannot read a resistance; it reads a voltage. Something
has to do the conversion, and that something is the **voltage divider**.

The LDR is the upper leg, the 10 kΩ is the lower one, and the node between them
sits at 5 V × (10 k) ÷ (R_LDR + 10 k). In the dark that is 5 × 10/110 =
**0.45 V**. In bright light it is 5 × 10/11 = 4.5 V — except the transistor's
base clamps at about 0.7 V and refuses to go higher, which is why step 2 reads
0.74 rather than 4.5.

So: dark means base below 0.7 V and the transistor off. Bright means the
divider pushing well above 0.7 V, the base clamping there, and the transistor
on. **The light turns it on and the dark turns it off** — which follows from
the LDR being the *upper* leg. Swap the LDR and the 10 kΩ around and the whole
thing inverts, which is exactly how you would build a lamp that comes on at
dusk.

Step 5 is the design knob. Changing the fixed resistor moves the threshold,
because the divider balances where R_LDR is comparable to it. Pick the fixed
resistor near the LDR's resistance *at the light level you want to trigger at*,
and the switching point lands where you meant it to. That is the whole method,
and it works the same for temperature (NTC), moisture, force — any sensor whose
output is a resistance.

## Why it matters

Almost every cheap sensor in a beginner's kit is a resistance that changes with
something, and almost none of them can drive anything on their own. This
divider-plus-threshold pattern is how they get turned into a decision. Street
lights, night lights, automatic backlights, the "is the lid open?" detector in
a printer — all the same three parts.

## Go further

- **Next:** [pc48-ldr-comparator](../pc48-ldr-comparator) — the same sensor
  with a comparator instead of a bare transistor, which gives a much sharper,
  more predictable threshold.
- **Then:** [pc55-ntc-indicator](../pc55-ntc-indicator) — the identical circuit
  sensing temperature.
- **Also:** [16-ldr-bargraph](../16-ldr-bargraph) — the same LDR read as a
  *number* by a program, instead of as an on/off decision.
- **Experiment:** the transistor's threshold is fuzzy — around 0.7 V, drifting
  with temperature — so this circuit fades on rather than snapping on. Predict
  what a comparator would change about that before you open
  pc48-ldr-comparator, then check whether you were right.
