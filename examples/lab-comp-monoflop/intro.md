# Complementary timer with ready light

**Teaches:** complementary monostable, RC timing, status indicator

## What to do

Click **Sim**: the green READY LED is lit. Press START (button_3): the red ACTIVE LED lights and READY goes out until the time is up. Close LONG (switch_12) and press START again, then wait.

## What you should see

- Without LONG: ACTIVE for under a second.
- With LONG: ACTIVE for over half a minute.
- READY is lit whenever ACTIVE is not.

## Why it works

START switches the NPN on, which switches the PNP on, whose collector jumps to +9 V and through the capacitor keeps the NPN's base fed. As the capacitor charges, that current falls, and when it is too small the pair lets go. A bigger capacitor takes longer to charge, so the time is longer. The third transistor simply shorts the green LED while the PNP is on.
