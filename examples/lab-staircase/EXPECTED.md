# lab-staircase — expected behaviour

## Circuit
Three blocks on 9 V.

- **Clock:** half 1 of an LM358 as a relaxation oscillator. Three 100 kΩ resistors (to +9 V, to ground, and from the output) set the hysteresis at the non-inverting input; R_t = 47 kΩ and C_t = 10 µF time it. A red LED with 1 kΩ shows the clock.
- **Charge pump:** C_pump = 100 nF from the clock output to a node with two diodes: one to ground (anode at the node), and one into the integrator's input (cathode at the node).
- **Integrator:** an op-amp with C_int = 1 µF from its output to its inverting input and its non-inverting input at ground. RESET shorts C_int. An analog meter (7.5 V full scale) reads the output. The integrator uses the simulator's generic op-amp with its output limited to 0 V … 7.5 V, the same range an LM358 has on 9 V (see the note below). Half 2 of the LM358 is parked as a grounded follower.

## Observable behaviour
- **The clock** swings between about 0.02 V and 6.98 V at about 1.5 Hz (R_t × C_t gives a period near 0.7 s).
- **One step per clock cycle:** every time the clock output falls, C_pump drags the pump node down, the second diode conducts and pulls a fixed packet of charge out of the integrator's input. The integrator answers by raising its output by exactly that charge divided by C_int. When the clock rises again, the first diode recharges C_pump from ground, ready for the next packet.
- **Equal steps of about 0.56 V:** ΔU = C_pump / C_int × (clock swing − two diode drops) = 0.1 × (6.96 V − 1.37 V) ≈ 0.56 V. The output reads 0.56 V, 1.12 V, 1.68 V, 2.24 V … after the first, second, third, fourth step, the meter needle jumping one notch each time.
- **Full after 13 steps:** the 13th step lands at about 7.28 V; the next one runs into the 7.5 V limit and the staircase stops climbing.
- **RESET** empties C_int: the output falls to 0 V and the climb starts again.

**Note on the model.** With the LM358 model in the integrator seat, the first charge packets produced steps of several volts and the step size changed from step to step. The packet is delivered in a few microseconds, and that model's output does not follow so fast an edge. The generic op-amp gives the steps the charge arithmetic predicts.

## What this verifies
1. A capacitor charged and discharged through diodes moves a fixed packet of charge per cycle.
2. An integrator adds those packets up: output step = ΔQ / C_int, so the output counts clock pulses in analog form, the basis of ramp-type converters and pulse-rate meters.

```assert
# t = 1 ms: no step yet, clock output high
net u_int.out V 0.00 +-0.01
net u1.1_out V 6.97 +-0.10
```
