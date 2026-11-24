# A falling magnet starts a timer

A magnet dropped through a coil makes a short pulse. Here it starts a two-transistor monostable: the LED comes on for about a third of a second, goes out again, and the circuit waits for the next magnet. A pot sets how big a pulse it takes.

**Teaches:** the monostable (one-shot), sensitivity set by a bias

## What to do

Click **Sim**. In the instruments column press **Drop magnet**, wait for the LED, then drop it again. Now turn the sensitivity pot about halfway down and drop the magnet once more.

## What you should see

- About 0.2 s after each drop (the fall time) the red LED lights for about 0.3 s, then goes out by itself.
- It works again on every drop.
- With the pot halfway down, the same magnet no longer triggers anything.

## Why it works

At rest the right transistor is on and holds the left one off. The pot lifts the left transistor's base to just below its switching point. The coil's pulse, passed on by a capacitor, pushes it over: the left transistor switches on, its falling collector drags the right transistor's base below zero through the 10 µF capacitor, and the right transistor lets go. Until that capacitor has recharged through 47 kΩ, the circuit stays in this state, then it falls back. Turn the pot down and the base rests too far below the threshold for the pulse to reach it.
