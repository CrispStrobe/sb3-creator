# Static charge detector

A Darlington pair with a bare wire on its base. Bring a rubbed plastic ruler towards the wire and the LED glows while the ruler moves.

**Teaches:** electrostatic induction, current as moving charge, Darlington gain

## What to do

Click **Sim**. Turn the probe's knob from 0 to 1: that moves the charged ruler close to the wire (it takes the hand about 0.2 s). Then turn it back to 0.

## What you should see

- Ruler approaching: the LED lights up dimly while it moves, then goes dark again once the ruler is still.
- Ruler moving away: the LED stays dark; the base is pushed negative instead.

## Why it works

The charged ruler pulls opposite charge into the near end of the wire and pushes like charge away into the transistor's base. Only while the ruler moves does that charge change, so only then does a current flow, a few nanoamps. The Darlington pair multiplies it by about 40 000, enough to light the LED. Moving the ruler away sends the current the other way, which a transistor base cannot use.
