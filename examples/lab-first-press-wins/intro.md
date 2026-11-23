# Who pressed first? A transistor lockout duel

Two players, two buttons, two LEDs, and no software. Whoever presses first lights their LED, and that LED's voltage switches on a transistor that short-circuits the other player's LED. A late press then does nothing, however hard it is held.

**Teaches:** latches as arbiters, cross-coupled transistors, race conditions

## What to do

Everything sits on one breadboard. Click **Sim**, then press and hold Player A's button: the red LED lights. Keep holding it and press Player B's button as well. The green LED stays dark. Release both and start again with B first.

## What you should see

- First press wins and its LED stays lit while the button is held.
- The second player's LED node is held near 0 V by the other side's transistor.
- Release both buttons to reset.

## Why it works

Each button is the supply for one half of a cross-coupled pair. The half that gets power first switches on the transistor guarding the other half, so the other half never gets a chance. The small base capacitors give the circuit a memory of who came first. Compare it with the reaction-duel programs, where a microcontroller does the same job in software.
