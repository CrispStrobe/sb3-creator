# Drop a magnet through a coil: the pulse flips a flip-flop

A magnet falling through a coil of wire makes a short voltage pulse in it, with no battery and no contact. Feed that pulse into a transistor flip-flop and the flip-flop remembers that the magnet went through.

**Teaches:** electromagnetic induction, flux change, a flip-flop as memory

## What to do

Click **Sim**. Green is on. In the instruments column press **Drop magnet** and wait a moment while it falls. Then press the push button on the board (reset). Try the scope on the coil to see the two pulses.

## What you should see

- About a fifth of a second after the drop, the LEDs swap: red on, green off.
- They stay that way until you press the reset button.
- On the scope: one pulse as the magnet enters the coil and an opposite, bigger one as it leaves.

## Why it works

The coil "feels" how much of the magnet's field passes through it. While the magnet approaches, that amount grows and a voltage appears; as it leaves, the amount shrinks and the voltage turns around. The faster the change, the bigger the voltage. The first pulse switches on Q1, which switches off Q2, which keeps Q1 on: the flip-flop now holds the event. Bicycle speedometers and guitar pickups use the same induction.
