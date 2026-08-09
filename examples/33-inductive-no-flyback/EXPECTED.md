# 33-inductive-no-flyback — the flyback diode lesson

## Circuit

MCU P1.0 → 1 kΩ → TIP120 base. TIP120 collector → DC motor → VCC.
TIP120 emitter → GND. **No flyback diode across the motor.**

## Why this matters

When the TIP120 turns off, the motor's inductance tries to maintain
current flow. With nowhere to go, the voltage at the collector spikes
to potentially hundreds of volts — far beyond the TIP120's Vceo (60 V).
On a real bench this destroys the transistor, sometimes immediately,
sometimes after a few hundred switching cycles.

The fix: a diode across the motor (cathode → VCC, anode → collector).
When the transistor turns off, the diode clamps the spike to VCC + 0.7 V.

Compare with example 10-motor-speed, which includes the flyback diode.

## Observable behaviour

When the transistor switches off:
- **Without diode:** collector voltage spikes well above VCC (model-dependent;
  the engine may clamp or flag it)
- **With diode (example 10):** collector voltage clamps to ~5.7 V

## What this verifies

1. The engine models (or should model) inductive kickback
2. The absence of a flyback diode is visible as a voltage spike
3. Compare with example 10 (correct circuit) to see the difference
