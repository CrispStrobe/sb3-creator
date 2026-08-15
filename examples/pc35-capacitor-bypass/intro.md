---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc01-led-resistor]
teaches: [bypass-capacitor, decoupling, charge-reservoir, parallel-circuit]
---

## What you see

A resistor and an LED, which you have built before — plus a capacitor sitting
across the LED, going nowhere. It is not in the path of the current. It is beside
it.

## Try this

1. Click **Sim**. The LED lights at **2.97 mA**, which is exactly what this
   resistor and this LED would do on their own.
2. Work it out: (5 V − 2.03 V) ÷ 1000 Ω = 2.97 mA. The capacitor contributes
   nothing to that sum.
3. Watch the first half-second closely. The LED does not snap on — it comes up
   over a few hundred milliseconds, while the capacitor fills.
4. Change `cap` from `0.00047` (470 µF) to `0.0000001` (100 nF), the size real
   boards actually use, and watch again. The delay is gone: too fast to see.
5. Delete the capacitor entirely. The steady-state reading does not change at
   all.

## What is going on

Step 5 is the confusing part of this circuit, so start there: in steady state the
capacitor does nothing. Once it is charged to the same voltage as the LED, no
current flows into or out of it, and the circuit behaves exactly as if it were
not there.

Capacitors only respond to *change*. This one is a small local tank of charge
parked right next to the load. When the load suddenly wants more current than the
supply can deliver through the resistance of the wires, the tank empties a little
and covers the gap; when demand falls again, it refills. All of that happens
faster than the supply can react, which is the whole point — the capacitor is
closer to the load than the power supply is.

Step 3 is the same physics running the other way: at switch-on, current has to
fill the capacitor before the LED can have its share, so the turn-on is smoothed
out. With 470 µF you can watch it happen. Step 4 is what a real board does: 100 nF
gives the identical behaviour on a microsecond timescale, which is where digital
chips live. A logic chip switching its outputs pulls a sharp spike of current for
a few nanoseconds, and without a nearby capacitor that spike drags the whole
supply rail down and the chip next door reads it as a glitch.

That is why this component is also called a **decoupling** capacitor: it
decouples one part's current spikes from everybody else's supply.

## Why it matters

Look at any circuit board with a chip on it and you will find a small capacitor
within a centimetre of every power pin. There are usually more of them than
anything else on the board. They do nothing that you can measure with a meter,
they are never mentioned in the schematic's explanation, and boards built without
them fail intermittently in ways that take days to find.

## Go further

- **First, if you have not:** [pc06-rc-charge](../pc06-rc-charge) — why filling a
  capacitor takes time.
- **Compare:** [pc29-capacitor-discharge](../pc29-capacitor-discharge) — the same
  stored charge, deliberately used up instead of held in reserve.
- **Next:** [pc21-rc-smoothing](../pc21-rc-smoothing) — the same idea sized to
  flatten a whole supply.
- **Experiment:** put the capacitor in *series* with the LED instead (cathode to
  capacitor, capacitor to ground) and run it. The LED lights briefly and then
  goes out for good, because a charged capacitor blocks steady current. That one
  wire is the difference between a bypass and a block — and it was this example's
  own bug before the audit.
