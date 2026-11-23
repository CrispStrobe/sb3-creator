# One press, one beep: a gate timer

Press a button and a light comes on with a beep, and goes off by itself a moment after you let go. Four NAND gates, a capacitor and a resistor do it: one gate notices the press, the capacitor remembers it for a while, the others turn the memory into light and sound.

**Teaches:** monostable (one-shot) timing, RC discharge, Schmitt triggers, gating a tone

## What to do

Click **Sim**. Press the button briefly and count how long the LED stays on. Then hold the button down for a few seconds before letting go.

## What you should see

- A beep of about 570 Hz with the green LED.
- Both stop just under a second after you let go, however long you held the button.

## Why it works

Pressing the button charges the capacitor almost at once through the diode. When you let go, it can only drain slowly through the 1 MΩ resistor. Gate 2 watches its voltage, and its Schmitt-trigger input gives one clean switch when the voltage falls past the lower threshold. Gates 3 and 4 use that signal to switch a tone oscillator on and off. A bigger capacitor or resistor makes the beep longer.
