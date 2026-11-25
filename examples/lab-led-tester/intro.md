# LED-circuit tester: one tone for open, another for short

Is the indicator LED broken off, or is something shorting it? This tester tells you by ear: silence if all is well, a high tone for an interrupted circuit, a low tone for a short.

**Teaches:** window comparator, fault finding, controlling a tone with a voltage

## What to do

Click **Sim**. Open the **BREAK** switch (the wire to the LED is broken), close it again, then close **SHORT** (something bridges the LED).

## What you should see

- All fine: the green LED lights, silence.
- BREAK: the LED goes out and a higher tone sounds.
- SHORT: the LED goes out and a lower tone sounds.

## Why it works

The tester pushes a little current into the LED circuit and looks at the voltage: about 1.8 V for a working LED, nearly the full 9 V if the circuit is open, nearly 0 V if it is shorted. Two op-amps check "too high" and "too low". Each one, when it fires, sets a different voltage for the base resistors of a transistor tone generator: a higher voltage, a higher tone; no voltage, no tone.
