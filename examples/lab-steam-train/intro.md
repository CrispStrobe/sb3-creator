# Steam train: noise switched on and off

The hiss of a broken-down junction, but the junction is fed from one side of a slow blinker circuit. A few times a second the noise source is switched on and off, and the earphone puffs like a steam locomotive.

**Teaches:** gating a signal, two-transistor astable, noise source

## What to do

Click **Sim** and listen. Watch the collector of the right-hand astable transistor.

## What you should see

- The astable flips about three times a second.
- While its transistor is off, its collector is near 9 V, the noise junction breaks down and the earphone hisses. While it is on, the collector is near 0 V and the earphone is silent: chuff … chuff … chuff.

## Why it works

The astable's collector is the supply of the noise source. Only when that collector is high enough to push the junction past its breakdown voltage does the avalanche current, and with it the noise, flow. The two capacitors and 100 kΩ resistors set the rhythm: bigger capacitors make a slower train.
