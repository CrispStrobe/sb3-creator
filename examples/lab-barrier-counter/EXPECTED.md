# lab-barrier-counter — expected behaviour

## Circuit
5 V supply.

- **Transmitter:** a 555 astable (1 kΩ, 6.8 kΩ, 100 nF; about 1 kHz) flashes an IR LED through 47 Ω.
- **Receiver,** 15 cm away (`light_path`, medium air; knob `blocked`, how much of the beam an object covers, 0 to 1): a phototransistor with a 22 kΩ collector load. 10 nF and two diodes pump its flashes into 220 nF (470 kΩ across it), which drives Q1 through 10 kΩ. Q1's collector (10 kΩ) drives Q2 through 10 kΩ; 1 MΩ from Q2's collector back to Q1's base gives a little hysteresis, so each change is one clean edge. Q2's collector is high while flashes arrive and falls when the beam is broken.
- **Clock gate:** that signal goes through the first changeover contact of a two-pole relay (rest side) to input A of a 74HC93; 100 kΩ holds the input low when the contact opens, and 1 nF keeps it quiet. QA feeds input B; red LEDs (470 Ω) show QA, QB, QC. The counter steps on a falling edge: one count per interruption. (The 74HC93 stands in for a CMOS 7-stage binary counter.)
- **Decoder:** two diodes from QB and QC to a node pulled up by 4.7 kΩ: high only at the count of 6. A further diode and 1 kΩ (10 kΩ base to emitter) feed Q3, which pulls in the relay (flyback diode). Pole 1 cuts the clock; pole 2 lights a green lamp through 220 Ω.
- **Reset:** a button pulls both reset inputs high (10 kΩ pull-down otherwise).

## Observable behaviour
- After power-on the receiver settles within a few hundredths of a second, its output high, nothing counted.
- Each interruption counts one: 1, 2, 3, 4, 5, 6.
- At the sixth the relay pulls in (coil about 24 mA) and the lamp lights (about 13 mA). The clock is cut, so further interruptions are not counted.
- Reset clears the counter, the relay drops out, counting starts again.
- Steady light does not count as a beam: the pump only passes flashes. With weak room light on the phototransistor (`light` 0.01) a blocked beam still reads as broken. Strong room light (`light` 0.1) saturates the phototransistor (its collector sits at 0.06 V) and blinds the receiver: a real receiver needs a hood.
- Reset is used here at the count of 6, when QA is low: the engine's 74HC93 otherwise adds a phantom count after a reset taken while QA is high (an engine bug, reported).

## What this verifies
1. A pulsed light barrier: the receiver looks for the transmitter's flashes, not for brightness.
2. Counting interruptions, decoding a count with diodes, and a relay that stops its own clock.

```assert
# t = 1 ms: 555 control pin at 2/3 supply; receiver not yet pumped (Q1 off, Q2 on), decoder low.
net timer_555_3.control V 3.333 +-0.01
net npn_21.collector V 0.04 +-0.03
net npn_41.base V 0.16 +-0.05
```
