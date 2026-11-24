# lab-ir-remote-toggle — expected behaviour

## Circuit
5 V supply.

- **Transmitter:** a button keys an IR LED through 100 Ω.
- **Receiver:** a phototransistor 30 cm away (`light_path`, medium air; knob = distance, 10 to 150 cm). Its emitter feeds the base of an NPN, with 220 kΩ from base to emitter; the NPN's collector has a 10 kΩ load. While the IR shines, the NPN pulls its collector low.
- **Edge to pulse:** 220 nF passes only the falling edge of that collector to a node held high by 10 kΩ; a diode lets the resulting dip pull the op-amp's + input down.
- **Monoflop:** one half of an LM358. Its - input sits at 2.5 V (two 10 kΩ). Its + input is held high by 1 MΩ, so at rest the output is high. A dip below 2.5 V flips the output low, and 47 nF from the output to the + input drags that input further down; it recovers through 1 MΩ and the output returns high: one pulse per flash.
- **Toggle:** the pulse clocks input A of a 74HC93; its first stage is a toggle flip-flop (it changes state on every falling clock edge). QA drives an NPN (4.7 kΩ) that pulls in a relay (flyback diode); the relay's contact lights a green lamp through 220 Ω. The 74HC93 stands in for a CMOS 7-stage binary counter; only its first stage is used.

## Observable behaviour
- Power-on: the 47 nF starts empty, so the monoflop gives one power-on pulse of its own; after about 33 ms it is ready. That pulse's falling edge comes at time zero, before any count is stored, and the lamp starts off.
- Press the button and hold it for 0.1 s: the receiver goes low at once (0.09 V), the monoflop gives exactly one pulse of about 40 ms, QA goes high, the relay pulls in and the lamp lights (about 13 mA). Holding longer does nothing more: the capacitor only passes the edge.
- Release, press again briefly: the next pulse toggles QA back, the relay drops out, the lamp goes off.
- Range: at 50 cm the receiver still switches; at 1 m the light is too weak to lift the NPN against its 220 kΩ, and the button does nothing.

## What this verifies
1. Turning a flash of any length into one clean pulse (an edge-triggered monoflop).
2. A binary counter's first stage is a toggle flip-flop: one press on, next press off.

```assert
# t = 1 ms: no flash; the receiver is dark, the reference sits at half supply,
# the monoflop is in its power-on pulse (+ input still low, output low).
net npn_8.collector V 5.00 +-0.02
net lm358_17.1_neg V 2.50 +-0.02
net lm358_17.1_pos V 0.110 +-0.02
net lm358_17.1_out V 0.005 +-0.02
```
