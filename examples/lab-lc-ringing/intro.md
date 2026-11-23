# Coil and capacitor: damped ringing

Charge a capacitor, then connect it across a coil. It does not just empty out: the current builds up a magnetic field in the coil, which then pushes the charge back the other way. The voltage swings back and forth like a pendulum, at a frequency set by the coil and the capacitor, and dies away slowly because the coil's wire has resistance.

**Teaches:** resonance, energy swapping between electric and magnetic fields, damping

## What to do

Click **Sim**. The capacitor is charged to 5 V. Flip the charge/ring switch to "ring" and watch the capacitor voltage on the scope. Then flip back to "charge", add the 3 µF capacitor with the other switch and ring again.

## What you should see

- A sine wave of about 500 Hz that shrinks with every swing.
- With four times the capacitance: half the frequency, about 250 Hz.

## Why it works

Coil and capacitor store energy in two different ways and keep handing it over to each other. The frequency is f = 1 / (2π√(LC)), so it depends on the square root of L times C. The 10 Ω resistor stands for the coil's winding; it turns a little energy into heat on every swing, which is why the ringing fades. Add energy at the right moment on every swing and you get an oscillator, the basis of every radio transmitter.
