# Boost Faceplate

The Boost Move Hub has no screen — just an RGB status LED and two
built-in motors. This faceplate provides a power slider, a go/stop
toggle, and a forward/reverse toggle; the LED colour reflects the
motor state.

## Try this
1. Click **Run on Simulator** — the LED starts green (idle).
2. Set the power slider to 75 and toggle **GO** on — the LED turns blue
   (forward).
3. Toggle **FWD/REV** — the LED turns red (reverse).
4. Toggle **GO** off — the LED returns to green.

## What is going on
The **rgb_light** widget reads `hub_led` (24-bit 0xRRGGBB). The
program maps motor state to colours: green=idle, blue=forward,
red=reverse, with brightness scaling by power level. This matches the
Boost extension's `motorOn`, `motorPower`, and `motorDirection` blocks.
