# lab-ir-remote-toggle — expected behaviour

## Circuit
9 V battery.

- **Transmitter:** a button keys an IR LED through 220 Ω.
- **Receiver:** a phototransistor 30 cm away (`light_path`, medium air; knob = distance, 10 to 150 cm), emitter follower into 100 kΩ: a flash lifts its emitter.
- **Monoflop:** an LM386 audio power amplifier (gain 20, pins 1, 8 and 7 open). 220 nF passes the receiver's rising edge to +IN. 1 MΩ from the supply to -IN, against the chip's own input resistance, puts a little under half a volt on -IN, so at rest the output sits at its low limit, just under one volt. The edge lifts +IN past -IN, the output jumps to its high limit, and 220 nF from the output to +IN holds +IN up; it decays through 47 kΩ (and the chip's input resistance) until the output falls back.
- **Toggle flip-flop:** two NPN transistors, each collector through a 1 kΩ and an LED (red, green) to +9 V, cross-coupled by 22 kΩ and 27 kΩ. The amplifier's output reaches each base through 2.2 nF and a steering diode; 47 kΩ from each collector to its diode means only the conducting transistor's diode can pass the falling edge at the end of the pulse, and that transistor turns off.

## Observable behaviour
- Power-on: the amplifier starts at its high limit and gives one power-on pulse; its end flips the flip-flop from green to red. After 0.1 s everything has settled.
- Press the button and hold it: the receiver's emitter rises by about 2.5 V, the monoflop gives exactly one pulse of about 16 ms, and at its end the flip-flop changes colour. Holding longer changes nothing: the capacitor only passes the edge.
- Every further press flips it again: green, red, green.
- At 1 m the flash lifts +IN by too little to pass -IN: the monoflop does not fire.

## What this verifies
1. An audio power amplifier with positive feedback through a capacitor works as a monoflop: one clean pulse per flash.
2. A two-transistor flip-flop with steering diodes divides pulses by two: a toggle flip-flop.

```assert
# t = 1 ms: -IN on the 1 MOhm / 50 kOhm divider; flip-flop green (Q2 on).
net lm386_9.inn V 0.429 +-0.01
net npn_14.collector V 0.09 +-0.03
net npn_13.collector V 7.20 +-0.1
```
