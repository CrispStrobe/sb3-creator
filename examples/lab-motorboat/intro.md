# Motor-boating: when the battery makes the amplifier oscillate

A three-stage amplifier with no input at all. From a good battery it is quiet. From a weak battery it starts to putter on its own, like a motor boat. A capacitor in the right place calms it.

**Teaches:** supply impedance, positive feedback, decoupling capacitors

## What to do

Click **Sim** and watch the supply rail (the right side of the 47 Ω resistor) and the loudspeaker. Flip the **weak** switch (left: fresh battery, right: weak battery, 47 Ω inside) and the **dec** switch (right: the first two stages fed through 1 kΩ and 470 µF).

## What you should see

- Weak battery, no decoupling (as loaded): the rail and the speaker swing up and down on their own.
- Fresh battery: steady, silent.
- Weak battery with decoupling: the swinging dies away.

## Why it works

The output stage draws tens of milliamps. Through the battery's internal resistance every change of that current moves the supply voltage. The first stage's collector hangs on that supply, so the change goes into the amplifier again, is inverted once by the second stage and changes the output current in the same direction as before: the loop feeds itself and oscillates. The 1 kΩ resistor and the 470 µF capacitor give the early stages their own quiet supply, and the loop is broken. Every real amplifier has such decoupling capacitors.
