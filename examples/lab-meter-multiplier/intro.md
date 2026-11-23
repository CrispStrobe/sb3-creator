# Moving-coil voltmeter: series multipliers and loading

Inside an analogue meter is a coil that swings a needle. This one deflects fully at only 100 µA and has 1 kΩ of resistance. Put a resistor in series and it becomes a voltmeter for any range you like. Then use it to measure a simple divider, and watch the meter change the voltage it is measuring.

**Teaches:** Ohm's law in instruments, series multipliers, meter loading

## What to do

Click **Sim** and read the needle on the 5 V range. Compare it with the reference voltmeter: both show about 4.09 V, not the 4.5 V you would calculate for two equal resistors. Flip the range switch to 10 V. The reading rises to about 4.28 V, closer to the truth, but the needle now swings only half as far.

## What you should see

- 5 V range: 4.09 V, needle at about 82 % of full scale.
- 10 V range: 4.28 V, needle at about 43 %.
- The reference voltmeter changes too: the meter really does pull the divider down.

## Why it works

Full scale needs 100 µA. On the 5 V range the meter has 50 kΩ in total, so 5 V drives exactly 100 µA through it. That 50 kΩ also sits in parallel with the bottom 10 kΩ of the divider and lowers the voltage there. A good voltmeter has a resistance much higher than the circuit it measures.
