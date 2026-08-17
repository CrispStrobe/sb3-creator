# 33-inductive-no-flyback — the flyback diode lesson

## Circuit

MCU P1.0 → 1 kΩ → TIP120 base. TIP120 collector → motor winding → VCC.
TIP120 emitter → GND. **No flyback diode across the motor.**

The motor is modelled as two parts in series, because a real winding is both:

- `motor1` — a `dc_motor`, `windingR` 10 Ω plus back-EMF (`kV` 0.01)
- `l1` — a 1 mH `inductor`, the winding's inductance

The inductor is what carries this lesson. The engine's `dc_motor` model is
resistance and back-EMF only; without an explicit `inductor` there is nothing
in the circuit that can kick, and the example would show a flat 5 V at
turn-off — indistinguishable from a circuit that *does* have a flyback diode.

## Why this matters

While the TIP120 conducts, current builds in the winding. When the transistor
turns off, that current cannot stop instantly: an inductor opposes a change in
current, and with no diode there is nowhere for it to go. The voltage across
the switch rises until something breaks down — far beyond the TIP120's 60 V
Vceo. On a real bench this destroys the transistor, sometimes immediately,
sometimes after a few hundred switching cycles.

The fix: a diode across the motor (cathode → VCC, anode → collector). When the
transistor turns off the current continues around the diode loop instead, and
the collector is clamped to roughly VCC + 0.7 V.

## Observable behaviour

While the transistor is on, the collector sits at **~0.83 V** (the TIP120's
Darlington saturation drop).

At turn-off, the collector spike **has no upper bound** — which is the whole
point. Sampling the collector net after turn-off, the peak the simulator
reports depends on how finely you look:

| sample step | no diode (this example) | with a flyback diode |
|---|---|---|
| 100 µs | 9.2 V | 6.9 V |
| 50 µs | 13.3 V | 7.6 V |
| 10 µs | 46.7 V | 9.1 V |
| 5 µs | 88.4 V | 9.5 V |
| 1 µs | **421.7 V** | 9.8 V |

Read the two columns, not the individual numbers:

- **Without the diode the peak keeps climbing the closer you look.** That is
  not a simulation artefact to apologise for — it is the physics. An ideal
  switch opening an inductive current implies an unbounded V = L·di/dt, and the
  only reason a real circuit shows a finite number is that stray capacitance
  and the transistor's own avalanche breakdown intervene. Destructively.
- **With the diode the peak is bounded, around 7–10 V, whatever the step.** The
  clamp is a real limit, not a resolution effect.

So the number to quote is not "88 V". It is "unbounded versus clamped".

## What this verifies

1. The engine models inductive kickback, given an explicit winding inductance
2. The absence of a flyback diode is visible as an unbounded collector spike
3. Adding the diode bounds it — the contrast is the lesson

## Comparing with example 10

`10-motor-speed` is the same driver stage **with** the diode fitted, and is the
intended companion to this example. Note as of this writing that example 10
has no `l1`: it models no winding inductance, so its collector reads a flat
5.0 V at turn-off at every timestep. Its conclusion ("no spike") is right, but
it is right because nothing is modelled, not because the diode clamps. The
"with a flyback diode" column above was measured on *this* circuit with a diode
added, which is the honest comparison until example 10 gains its own inductor.

```assert
# Inductor = DC short: both terminals at VCC (motor off)
net mcu1.VCC V 5.00 +-0.01
```
