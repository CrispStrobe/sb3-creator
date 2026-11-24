# lab-barrier-counter — expected behaviour

## Circuit
5 V supply.

- **Light barrier:** an IR LED (150 Ω) shines on a phototransistor 5 cm away (`light_path`, medium air). The path's knob is `blocked`, how much of the beam an object covers (0 = clear, 1 = fully blocked).
- The phototransistor is an emitter follower into 10 kΩ: its emitter is high while the beam is clear and drops to 0 V when it is blocked.
- **Clock gate:** that signal goes through the first changeover contact of a two-pole relay (common to the rest contact) to input A of a 74HC93; 100 kΩ holds the input low when the contact is open. QA feeds input B, so QA, QB, QC count in binary; red LEDs (470 Ω) show them. The counter steps on a falling edge, which here is the moment the beam is broken. (The 74HC93 stands in for a CMOS 7-stage binary counter.)
- **Decoder:** two diodes from QB and QC to a node pulled up by 4.7 kΩ: the node is only high when both outputs are high, the count of 6. A further diode and 1 kΩ (10 kΩ base to emitter) feed an NPN that pulls in the relay (flyback diode).
- **Relay:** pole 1 cuts the clock, pole 2 lights a green lamp through 220 Ω.
- **Reset:** a button pulls both reset inputs high (10 kΩ pull-down otherwise).

## Observable behaviour
- Beam clear: the follower sits at 4.85 V. Blocked: 0 V.
- Each interruption counts one: 1, 2, 3, 4, 5, 6 on the LEDs.
- At the sixth interruption the relay pulls in (coil about 24 mA) and the lamp lights (about 13 mA). Pole 1 has cut the clock, so further interruptions are not counted: the count stays at 6.
- Reset clears the counter, the decoder lets go, the relay drops out and counting starts again from 0.
- A beam only half covered is not an interruption (the follower stays above the counter's switching level); covered four fifths, it is.

## What this verifies
1. A light barrier turns passing objects into clock pulses.
2. Decoding a count with a diode AND gate: a relay after N events.
3. The relay stops its own clock: the count is held until reset.

```assert
# t = 1 ms: beam clear, count 0, decoder low, relay out.
net phototransistor_5.emitter V 4.85 +-0.05
net 74hc93_8.clk_a V 4.85 +-0.05
net npn_23.base V 0.16 +-0.05
```
