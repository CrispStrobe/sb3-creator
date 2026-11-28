# Monoflop: held trigger, edge trigger, diode

**Teaches:** monostable, edge trigger, timing

## What to do

Click **Sim** and give the button (button_15) a short press: the red LED lights for a moment. Press and hold it: red stays on. Slide TRIGGER (slide_switch_16) right and hold the button again: now the pulse has its fixed length. Finally open the DIODE switch (switch_12) and press once more.

## What you should see

- Short press: red for about 0.7 s.
- TRIGGER left and held: red as long as you hold.
- TRIGGER right: about 0.7 s, however long you hold.
- DIODE open: a little longer, about 0.74 s.

## Why it works

Pressing switches Q1 on. Its collector drops, and the capacitor passes that drop to Q2's base, so Q2 switches off and holds Q1 on. The capacitor then recharges through 100 kΩ; when Q2's base is high enough again, everything flips back. A trigger through a capacitor only passes the moment of pressing, so holding the button makes no difference.
