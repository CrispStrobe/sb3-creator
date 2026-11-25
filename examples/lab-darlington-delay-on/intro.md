# Darlington: delayed on, slow fade off

**Teaches:** Darlington pair, RC timing, delay

## What to do

Click **Sim**, then close the ON switch (switch_3) and count the seconds until the LED lights. Then open it again and count until it is out.

## What you should see

- After closing: about a second of nothing, then the LED fades up and is fully on after about 4 s.
- After opening: it stays on for a moment, then fades out within about 4 s.

## Why it works

The two transistors together need about 1.1 V before they start to conduct, and the capacitor takes a while to charge that far through 100 kΩ. When ON opens, the capacitor drains through 47 kΩ, and the LED dims as its voltage falls back past that threshold.
