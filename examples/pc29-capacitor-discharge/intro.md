---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc01-led-resistor]
teaches: [capacitor, energy-storage, rc-time-constant, discharge, diode-forward-voltage]
---

## What you see

A capacitor with a switch on each side of it. The left switch connects it to the
5 V supply; the right switch connects it to an LED. They are never both needed
at once — this circuit has two separate jobs, and you do them in order.

## Try this

1. Click **Sim**. Close `charge` and leave `discharge` open. Watch the
   capacitor voltage climb: 0.48 V after 0.1 s, 3.16 V after 1 s, 4.72 V after
   about 3 s.
2. Now open `charge` — the supply is gone — and close `discharge`.
3. The LED lights, at **2.44 mA**, with nothing but the capacitor feeding it.
4. Watch it fade: 1.49 mA at half a second, 0.91 mA at one second, 0.05 mA after
   four. The capacitor is running out.
5. Look at the capacitor voltage at the end. It stops near **2 V** and refuses to
   go lower.

## What is going on

A capacitor is two metal plates that do not touch. Push charge onto one plate and
it stays there, held by its attraction to the opposite charge on the other side.
That stored charge *is* the energy, and it will sit there until you give it a way
out.

Charging takes time because the current has to squeeze through the 1 kΩ resistor,
and it gets harder as the capacitor fills — the fuller it is, the less voltage is
left to push with. Multiply the resistance by the capacitance and you get the
**time constant**: 1000 Ω × 0.001 F = 1 second. After one time constant the
capacitor is about 63 % charged, after five it is close enough to full that
nobody argues. Step 1 shows it: 3.16 V of 5 V after exactly 1 s.

The interesting half is step 2. Now the supply is disconnected — the wire to it
is physically open — and the LED lights anyway. Nothing is producing energy; the
capacitor is *returning* what you put in a moment ago, and running the LED down
its own falling voltage.

Step 5 is the part worth remembering. The fade stops at about 2 V, not at 0 V.
That is the LED's forward voltage: below it, the LED simply stops conducting, so
the discharge path effectively closes itself and the remaining charge is
stranded. A capacitor emptying into a plain resistor decays smoothly towards
zero; one emptying into a diode hits a floor and parks there.

## Why it matters

This is where "unplug it and it's safe" stops being true. Camera flashes, power
supplies and motor drives all hold charged capacitors after the plug is out —
some at hundreds of volts, and quite happy to wait for you. It is also why
equipment carries **bleeder resistors**: a deliberate slow path to drain the
capacitor when the power goes away.

## Go further

- **First, if you have not:** [pc06-rc-charge](../pc06-rc-charge) — the charging
  curve on its own, without the LED complicating the end of it.
- **Next:** [pc43-bleeder-discharge](../pc43-bleeder-discharge) — the safety
  resistor that empties a capacitor for you.
- **Then:** [pc35-capacitor-bypass](../pc35-capacitor-bypass) — the same storage
  trick used to *steady* a supply instead of to run something.
- **Experiment:** replace the LED with a plain wire from `rload.b` to ground and
  watch the discharge again. Now it decays all the way down, smoothly, with the
  same 1 s time constant — because nothing is imposing a 2 V floor any more.
