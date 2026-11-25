# LED dimmer: an amplifier follows the pot

A pot can set a voltage, but it is a poor source of current: an LED fed straight from its wiper would also load it. Here an LM386 power amplifier copies the wiper's voltage to its output and supplies the LED's current itself. Its output cannot climb above about 8.1 V, so the LED can never be overdriven.

**Teaches:** a follower (output fed back to the minus input), output swing limits, a driver for a load

## What to do

Click **Sim** and turn the pot slowly from one end to the other. Watch the LED and the voltmeter on the output.

## What you should see

- The LED brightens smoothly as you turn the pot up.
- The voltmeter follows the pot closely, but it stops at about 8.1 V even when the pot is at 9 V.
- At the bottom of the pot the output rests at about 0.9 V, too little for the LED: dark.

## Why it works

The amplifier compares its two inputs and drives its output until they agree. Because the minus input is wired to the output, they agree when the output equals the wiper: it follows. The pot only has to supply a tiny input current; the LED's milliamps come from the amplifier's output stage.
