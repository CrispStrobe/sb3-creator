---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor, pc36-series-interlock]
teaches: [relay, coil, isolation, switching-delay, normally-open-contact]
---

## What you see

A small switch on the left, a relay in the middle, and an indicator LED on the
right. Look closely at the two supplies: the switch side runs on 5 V, the LED
side runs on its own 9 V source. No wire crosses between them. The relay is the
only thing that connects the two halves — and it connects them mechanically,
not electrically.

## Try this

1. Click **Sim**. Nothing lights: the relay's contact is open.
2. Close `sw1`. The LED comes on — but not instantly.
3. Watch `relay1.no` (the contact) while you toggle `sw1`. It jumps between
   about **2 V** (open, no current) and **9 V** (closed).
4. Read the coil: 5 V across 200 Ω is **25 mA**, and that is the whole cost of
   controlling the 9 V branch.
5. Read the LED branch: **6.93 mA**, coming out of the 9 V supply — a supply
   the switch is not connected to at all.

## What is going on

A relay is a switch that another circuit presses for you. Current through the
coil makes it an electromagnet, the magnet pulls a metal arm, and the arm
closes a contact. That is all.

The important word is **isolated**. The coil and the contact share nothing but
air and a piece of iron. So the 5 V control side can switch a 9 V load — and it
would work exactly the same if the load side were 230 V mains, or a different
kind of power altogether. Your finger on the switch never touches the load.

The delay in step 2 is real, not a simulation artifact. The arm has mass, so it
takes about **5 ms** to travel. Sample at 4 ms and the contact is still open;
sample at 6 ms and it has closed. That is why relays cannot switch quickly:
5 ms per operation means a few hundred operations a second at best, and each
one is a physical impact — relays wear out. Transistors do the same job in
nanoseconds, but they cannot isolate.

The contact used here is the **normally open** one (`no`): open when the coil is
cold, closed when it is energized. The relay also has a normally-closed contact
that does the opposite.

## Why it matters

This is how a 3.3 V microcontroller turns on a heater, a pump, or a room light.
The chip could never survive being wired to mains — so it doesn't have to be.
It spends 25 mA on a coil, and the coil does the dangerous part.

## Go further

- **Next:** [pc38-relay-changeover](../pc38-relay-changeover) — the other
  contact, and what "changeover" buys you.
- **Compare:** [pc32-pnp-high-side](../pc32-pnp-high-side) — switching a load
  with a transistor instead: faster, silent, and *not* isolated.
- **Experiment:** change `switchTimeMs` from 5 to 50 and sample the contact at
  10 ms. Nothing has moved yet. Relay datasheets call this "operate time" and
  it is one of the first numbers on the page.
