---
level: beginner
age: 12+
prereqs: [15-voltage-divider]
teaches: [capacitor, rc-charging, adc-sampling]
---

## What you see

A resistor and capacitor are wired in series from an MCU pin to ground. The MCU
drives the pin high, and the ADC on a second pin reads the voltage across the
capacitor as it charges. The voltage rises quickly at first, then slows down,
tracing the classic RC charging curve.

## Try this

1. Click **Sim**. The MCU drives the pin high and the ADC reading climbs from
   0 toward the supply voltage.
2. Watch the rate of climb. It is steep at the start and flattens out as the
   capacitor approaches full charge.
3. Change the resistor value -- double it. The curve has the same shape but
   takes twice as long to reach the same voltage. The time constant (R times C)
   has doubled.

## What is going on

A capacitor stores charge, and a resistor limits how fast charge can flow in.
Together they form an RC circuit with a time constant tau = R * C. After one
time constant, the capacitor reaches about 63% of the supply voltage; after five
time constants it is effectively full. The MCU's ADC samples the voltage at
regular intervals, giving you a digital snapshot of this analog curve. The shape
is always the same exponential -- only the speed changes with R and C.

## Why it matters

RC charging is the basis of timing circuits, filters, and touch sensors. Every
time you see a signal that ramps up or decays exponentially -- a loudspeaker
fading, a sensor settling, a power supply stabilising -- an RC time constant is
behind it.

## Go further

- **The voltage divider this builds on:**
  [15-voltage-divider](../15-voltage-divider) -- static resistor ratios before
  you add the time dimension.
- **RC used for timing:** [43-rc-timing](../43-rc-timing) -- using the charge
  time to measure something.
- **Experiment:** replace the capacitor with one ten times larger. The curve
  shape is identical but ten times slower. Predict the new time constant before
  you run it, then check.
