# lab-flicker-fusion — expected behaviour

## Circuit
- 5 V supply. A 555 astable is the clock: R1 = 1 kΩ, then R2 = 1 kΩ in series with a 10 kΩ pot (variable resistor), C1 = 1 µF.
- A 74HC74 D flip-flop with D tied to /Q toggles on every rising clock edge, so its Q output runs at exactly half the clock frequency with on and off times exactly equal.
- Q drives the test LED through 330 Ω. The second flip-flop in the package is unused, its inputs tied off.

## Observable behaviour

| knob | 555 clock | LED blink rate |
|---|---|---|
| 0 | about 62 Hz | about 31 Hz |
| half (authored) | about 109 Hz | about 54 Hz |
| full | about 455 Hz | about 227 Hz |

- At about 30 Hz most people still see flicker, especially out of the corner of the eye; somewhere between 50 and 90 Hz the LED looks steady and half as bright as fully on.
- The divide-by-two stage matters: the 555's own output is not a 50 % square wave, the flip-flop's is.
- The same effect is why an LED dimmed by fast pulses looks smooth. The on-screen LED is redrawn only at the screen's frame rate, so judge the effect on a real LED and read the frequencies from the scope.
- The 555's control pin sits at two thirds of the 5 V supply.

```assert
net u1.control V 3.333 +-0.01
```
