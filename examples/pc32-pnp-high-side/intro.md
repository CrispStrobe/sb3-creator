---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc01-led-resistor]
teaches: [pnp-transistor, high-side-switching, base-current, complementary-pair]
---

## What you see

A transistor sitting between the 5 V rail and the load, rather than between the
load and ground. The little arrow on the emitter points *in* towards the
transistor — that is what makes it a PNP rather than the NPN you have seen
before. The switch does not touch the LED's current at all; it only pulls on the
base.

## Try this

1. Click **Sim** with `sw` open. Nothing lights. Measure the base: **4.99 V**,
   just barely under the emitter's 5.00 V.
2. Work out what closing `sw` should do: it ties the base through `rb` towards
   ground.
3. Compare with [pc05-npn-switch](../pc05-npn-switch), where the transistor sits
   *below* the load and the base is pulled *up* to turn it on. Everything in this
   circuit is that circuit upside down.

## What is going on

A transistor is a valve that a small current opens. In an NPN, the small current
flows *into* the base and the valve connects the load down to ground — a
**low-side** switch. In a PNP, everything is mirrored: the small current flows
*out of* the base, and the valve connects the load up to the positive rail. That
is a **high-side** switch.

Why bother, when the NPN version is simpler? Because a low-side switch leaves the
load's supply connected while the load is off. For an LED nobody minds. For a
motor, a sensor, or a whole board you want to power down, "off but still wired to
5 V" is the wrong kind of off — anything that touches the load's positive
terminal is still live. High-side switching disconnects the supply instead.

The rule for turning a PNP on is the mirror of the NPN's: the base must be about
0.7 V *below* the emitter, not above it. `rb` limits how much base current flows
once it is — without it, base to ground would be a short across a forward-biased
junction. Whatever base current flows, the transistor passes about β (here 100)
times as much through the load, up to whatever the load itself allows.

That mirroring is why PNP and NPN are called a **complementary pair**, and
putting one of each on the same load — one to pull it up, one to pull it down —
is a push-pull output stage, which is what nearly every logic chip has inside it.

## Why it matters

Any battery-powered thing that switches parts of itself off to save power does it
high-side. So does anything that must be safe to touch when it is off. The NPN
low-side switch is the one you learn first because it is easier to drive; the
high-side one is the one you often actually need.

## Go further

- **First:** [pc05-npn-switch](../pc05-npn-switch) — the low-side original, with
  every part in the mirror-image position.
- **Compare:** [pc25-relay-isolator](../pc25-relay-isolator) — switching a load
  with complete isolation instead of a transistor.
- **Then:** [pc44-push-pull-led](../pc44-push-pull-led) — both polarities of
  transistor working on one load.
