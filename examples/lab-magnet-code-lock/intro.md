# A magnetic code lock: three quick north passes

A lock that opens with a magnet: sweep its north pole past the sensor three times in quick succession and the lock opens with a tone. A south pole in between, or passes that are too slow, and it stays shut.

**Teaches:** Hall sensors, counting pulses with a capacitor, latches

## What to do

Click **Sim**. Use the field slider of the Hall sensor: push it to about +0.8 and back to 0 three times quickly. Press LOCK. Then try north, north, south (−0.8), north; and three slow passes.

## What you should see

- Three quick north passes: the green LED lights and the tone sounds.
- A south pass in between: it stays locked.
- Too slow: it stays locked.

## Why it works

Every north pass gives a pulse, and each pulse adds a step of charge to a capacitor, like water poured into a leaky bucket. Only three quick steps fill it past the mark; slow ones leak away in between, and a south pass empties it at once. When it passes the mark, the gates flip a latch that holds the lock open until you press LOCK.
