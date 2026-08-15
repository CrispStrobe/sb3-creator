---
level: intermediate
age: 12+
prereqs: [pc15-mini-npn, pc01-led-resistor]
teaches: [npn-switch, base-current, current-gain, low-side-switching]
---

## What you see

A push button at the top left, a 10 kΩ resistor, an NPN transistor, and an LED
with its own 470 Ω resistor. The button is not in the LED's circuit at all —
trace the wires and you will find that the LED's current never goes anywhere
near it. The button only talks to the transistor's **base**.

## Try this

1. With the button **open**, read the base voltage: about **0.005 V**.
   Essentially zero. The transistor is off.
2. **Close** the button and read it again: **0.704 V**. It stops there and will
   not go higher no matter what you do to the rest of the circuit.
3. Work out the base current: the 10 kΩ resistor has 5 − 0.704 = 4.3 V across
   it, so 4.3 ÷ 10 000 = **0.43 mA**.
4. Compare that with what the LED branch needs — about **6 mA** — and notice
   that the button is handling **fourteen times less current** than the thing it
   controls.
5. Change the base resistor to 100 kΩ. The base voltage is still about 0.7 V;
   only the current changed, down to 43 µA.

## What is going on

A transistor is a valve where a small flow controls a big one.

The base-emitter junction of an NPN is just a diode, and like every diode it
holds its voltage nearly constant once it conducts — that is step 2, and the
0.7 V is why. What varies is the **current** through it, and that is set by the
resistor above, as in any diode-plus-resistor circuit you have already met.

The transistor then tries to pull β times that base current through the
collector. β is 100 here, so 0.43 mA in means it is asking for 43 mA out. The
collector branch can only supply about 6 mA, and when a transistor is asked for
more than the circuit can give, it stops trying to be proportional and simply
switches fully on. Collector nearly at the emitter's voltage, current set
entirely by the LED and its resistor. That state is called **saturation**, and
it is what you want from a switch: fully on or fully off, nothing in between.

The design rule falls out of it. You do not size a switching base resistor to
get exactly the collector current you want — you size it to ask for several
times more, so the transistor stays hard on even though β varies wildly between
individual parts. Here the margin is about 7:1.

Step 5 is worth thinking about further: at 100 kΩ the transistor asks for
4.3 mA, which is *less* than the 6 mA available. It would leave saturation and
start behaving like an amplifier, and the LED would be dimmer and its
brightness would depend on that particular transistor's β. Same circuit,
different job, one resistor apart.

## Why it matters

A microcontroller pin can typically source about 20 mA, and plenty of things
you want to control — motors, relays, filament lamps, LED strips — want far
more than that. This circuit is the standard answer, and it is everywhere. The
pin replaces the button, supplies half a milliamp, and the transistor does the
work.

## Go further

- **Next:** [pc24-light-gate](../pc24-light-gate) — the same switch with a
  light sensor in place of the button.
- **Then:** [pc39-nmos-switch](../pc39-nmos-switch) — the MOSFET version, which
  needs a *voltage* at its gate rather than a current.
- **Also:** [44-darlington-motor](../44-darlington-motor) — two transistors
  stacked for much more gain, driving a real load.
- **Experiment:** what base resistor would you need if the LED branch wanted
  60 mA instead of 6? (You want to ask for several times 60, so aim at
  I_b ≈ 3 mA: 4.3 V ÷ 0.003 A ≈ 1.4 kΩ.) Notice that the *button* still only
  carries those 3 mA.
