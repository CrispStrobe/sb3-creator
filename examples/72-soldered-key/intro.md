# The soldered key

This board came back from the factory, and something is wrong: **the LED
is on although nobody is pressing the key.**

The circuit above is fine — check it in Schematic view. The board below it
is not. Open **Board view (▦)** and look at the findings chip: the check
that catches this class of fault is called a *terminal short*. A 6×6 tact
switch has four legs, but only **two** terminals: the two legs on each
side are one piece of metal *inside* the switch. Route a ground track to
the wrong leg and you have wired the key permanently pressed — the copper
looks harmless, the schematic is correct, and the multimeter says "beep"
only after the switch is soldered in.

Find the pad that carries the wrong net, then check: which other pad is it
internally connected to? That is why the LED lights.

This is a real fault class: the board this lesson is modelled on had six
of these, and every one of them was a dead key.
