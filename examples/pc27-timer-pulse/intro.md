---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc01-led-resistor]
teaches: [555-timer, astable, rc-time-constant, threshold, hysteresis]
---

## What you see

A 555 timer chip, two resistors, a capacitor, and an LED. The LED blinks at
about five times a second — and there is no microcontroller and no program
anywhere in this circuit. The blinking comes from a capacitor filling up and
emptying out, over and over.

## Try this

1. Click **Sim**. The LED blinks steadily.
2. Watch the voltage on `c1`. It is a slow sawtooth, climbing to **3.33 V**,
   dropping to **1.67 V**, climbing again. It never leaves that band.
3. Watch `u1.output` at the same time. It is high while the capacitor climbs and
   low while it falls.
4. Change `c1` from `0.00001` (10 µF) to `0.000001` (1 µF). Everything gets ten
   times faster.
5. Change `r2` from 10000 to 47000 ohms. Now the on-time gets much longer than
   the off-time — the blink becomes lopsided.

## What is going on

The 555 is watching one wire — the capacitor — and it has two trip points, at a
third and two thirds of the supply. Between them it does nothing at all, which
is the whole trick.

Start with the capacitor empty. Below 1/3, the 555 sets its output **high** and
lets the capacitor charge, through `r1` and `r2` together. The voltage climbs,
slowly at first, then more slowly still, the way capacitors always fill.

The moment it passes 2/3, the 555 flips: output **low**, and an internal switch
grounds the junction between `r1` and `r2`. Now the capacitor empties through
`r2` alone. It falls until it drops below 1/3, and the whole thing starts over.

Two trip points instead of one is what stops it from stuttering. If the 555
switched at a single voltage, it would sit there chattering as the capacitor
hovered around it. Leaving a gap — **hysteresis** — means every decision commits
the circuit to a full charge or a full discharge.

You can predict the timing exactly: the high time is 0.693 × (R1 + R2) × C, and
the low time is 0.693 × R2 × C. Put this circuit's numbers in and you get 139 ms
high and 69 ms low, which is what the simulation measures. The odd-looking 0.693
is the natural logarithm of 2, and it shows up because charging a capacitor from
1/3 to 2/3 is exactly halfway home in the RC sense.

That also explains step 5: charging always goes through both resistors, but
discharging only ever goes through `r2`. The on-time can never be shorter than
the off-time in this arrangement.

## Why it matters

The 555 came out in 1972 and is still made by the billion. Before every project
had a microcontroller in it, this chip was how things blinked, beeped, buzzed
and waited. It is also the cleanest way to see that timing is just a capacitor
and a resistor — a microcontroller measuring milliseconds is doing the same
physics, one layer down.

## Go further

- **First, if you have not:** [pc06-rc-charge](../pc06-rc-charge) — one
  resistor, one capacitor, and the curve this whole circuit rides on.
- **Next:** [pc47-555-monostable](../pc47-555-monostable) — the same chip wired
  to fire once instead of forever.
- **Then:** [pc58-555-audio-pulse](../pc58-555-audio-pulse) — speed it up past
  20 Hz and it stops blinking and starts sounding.
- **Experiment:** work out what `c1` you would need for a 1 Hz blink, then try
  it. (You want the period near 1000 ms; the formulas above are all you need.)
