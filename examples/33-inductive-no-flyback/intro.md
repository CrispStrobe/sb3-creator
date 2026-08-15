---
level: advanced
age: 16+
prereqs: [28-diode-polarity, 38-npn-switch, 10-motor-speed]
teaches: [inductance, flyback, back-emf, transistor-protection]
---

## What you see

An STC12 pin drives a TIP120 Darlington through a 1 kΩ base resistor, and the
TIP120 switches a DC motor on and off once a second. The motor is drawn as two
parts in series — a `dc_motor` for its winding resistance and back-EMF, and a
1 mH `inductor` for the winding's inductance. What is deliberately **missing**
is the flyback diode across the motor. This is the circuit you are being shown
so that you do not build it.

## Try this

1. Click **Sim** and let it run through a few on/off cycles.
2. Put a scope probe on the collector node — the junction between the inductor
   and the TIP120. While the transistor conducts you will see about **0.83 V**,
   the Darlington's saturation drop.
3. Watch the instant the transistor turns off. The collector jumps far above
   the 5 V supply.
4. Now the important step. Change the sample interval — look at the turn-off
   with a 100 µs step, then 10 µs, then 1 µs. The peak reads roughly 9 V, then
   47 V, then **422 V**. It keeps climbing the closer you look.
5. Add the missing diode: a `diode` with its **cathode to VCC** and its
   **anode to the collector**, in parallel with the motor. Repeat step 4. Now
   the peak sits at 7–10 V and barely moves, however finely you sample.

## What is going on

An inductor resists a *change* in current. While the TIP120 conducts, current
ramps up through the winding and stores energy in its magnetic field. When the
transistor switches off, that current is still flowing and still has to go
somewhere — and in this circuit there is nowhere.

The winding's response is V = L·di/dt. If the switch opens ideally, di/dt is
effectively infinite, so the voltage is unbounded. That is precisely what step
4 shows you: the simulator is not being flaky when the number keeps rising, it
is telling you the truth about an equation with no solution. There is no
"correct" peak voltage to quote, which is why this example refuses to quote
one. **The answer is not a number; it is the word "unbounded".**

Real hardware, of course, does produce a finite number — because something
gives way first. Stray capacitance absorbs a little, and then the TIP120's
collector-emitter junction avalanches. Its Vceo rating is 60 V, and this
circuit blows past that on every single switching cycle. Sometimes the
transistor dies at once. More often it dies after a few hundred cycles, which
is worse, because your prototype "worked" long enough for you to trust it.

The flyback diode fixes this by giving the current the path it demanded. When
the transistor opens, the diode becomes forward-biased and the winding current
circulates harmlessly around the motor–diode loop, decaying into the winding
resistance. The collector is clamped to roughly VCC + 0.7 V. Note the polarity:
the diode is reverse-biased and idle while the motor runs normally, and only
conducts during the turn-off event. Fit it backwards and you short out your
supply.

One modelling note worth internalising: without the explicit `inductor` part
this example would show nothing at all. The engine's `dc_motor` is resistance
and back-EMF only, so a motor drawn without a winding inductance reads a
perfectly flat 5 V at turn-off — indistinguishable from a properly protected
circuit. A simulation can only warn you about the physics you gave it.

## Why it matters

Every relay coil, solenoid, motor and transformer you ever switch will do this
to you, and a missing flyback diode is one of the most common ways a working
prototype quietly destroys itself in the field. It is a single ten-cent part
standing between your driver stage and an avalanche breakdown once per cycle.

## Go further

- **The correct version:** [10-motor-speed](../10-motor-speed) — the same
  driver stage with the diode fitted.
- **Related clamping:** [39-zener-clamp](../39-zener-clamp) — bounding a
  voltage with a different part and the same idea.
- **Then:** [54-motor-driver](../54-motor-driver) — an L293D H-bridge, which
  has the flyback diodes built into the chip so you cannot forget them.
- **Experiment:** delete `l1` from `circuit.json` and re-measure the turn-off.
  The spike vanishes completely — a flat 5 V, identical to a circuit with a
  diode fitted. Nothing about the wiring changed; you removed the *physics*.
  That is the sharpest lesson here: a simulator will happily show you a safe
  result for a circuit that would destroy itself on the bench, if the model you
  gave it has no inductance in it.

> **Note on `l1`'s value.** Editing the `henrys` number will not currently
> change anything the solver does — the engine's transient path reads a
> different spelling of that parameter, so every inductor is stamped at 1 mH.
> It is logged in [AUDIT.md](../AUDIT.md). Until it is fixed, treat `l1` as
> present-or-absent rather than adjustable, and reason about larger coils on
> paper: a relay winding of tens of millihenries stores far more energy than
> this motor, and is correspondingly less forgiving.
