# lab-button-volume — expected behaviour

## Circuit
9 V.
All four amplifiers are one LM324 quad op-amp.
- **Tone:** op-amp section 2 is a relaxation oscillator (10 kΩ and 150 nF on its −IN, three 100 kΩ resistors
  setting its +IN to a third or two thirds of the supply): a square wave of a few hundred hertz. It reaches
  the volume node through 100 nF and 10 kΩ. A crystal earphone listens at the volume node through 1 µF.
- **Volume element:** a depletion-mode dual-gate MOSFET from the volume node to its source. The source
  sits on a red reference LED (2.2 kΩ from +9 V, about 1.66 V); the drain has no other DC path, so the
  channel only ever carries the tone: it is a voltage-controlled resistor shunting the node. Gate 2 is
  tied to +9 V.
- **Memory:** op-amp section 1 as an integrator: +IN at half supply (10 kΩ / 10 kΩ), 1 µF from the output
  to −IN, the output on gate 1. The "softer" button pulls −IN to ground through 47 kΩ, the "louder" button
  pulls it to +9 V through 47 kΩ. Sections 3 and 4 are parked as grounded followers.

## Observable behaviour
- At switch-on the integrator output, and so gate 1, sits at half supply, 4.5 V: almost 3 V above the
  source, the channel is about 100 Ω and shunts the tone: very quiet (well under 0.3 V peak to peak at
  the volume node).
- Hold "louder": the output ramps down at roughly 100 V per second. Once the gate is more than 1.2 V
  below the source the channel is pinched and the full tone, over 6 V peak to peak, reaches the earphone.
- A short tap on either button moves the volume one step; between taps the capacitor holds the gate
  voltage and the volume stays where it was.
- Holding a button past the end of the range winds the integrator up against its rail; the first tap in
  the other direction then has to undo that before the volume moves.

## What this verifies
1. An integrator turns button presses into a held control voltage (a memory).
2. A MOSFET channel is a resistor set by its gate voltage: here an electronic volume control.

```assert
# at switch-on: integrator at half supply, channel conducting, its drain at the source's DC level
net lm324_3.1_pos V 4.50 +-0.05
net dual_gate_mosfet_11.gate1 V 4.50 +-0.1
net dual_gate_mosfet_11.source V 1.66 +-0.05
net dual_gate_mosfet_11.drain V 1.66 +-0.05
```
