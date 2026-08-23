# WeDo 2.0 Faceplate

The WeDo 2.0 hub has no screen — just a coloured status LED. This
faceplate shows the RGB light, two tilt-angle sliders (simulating the
built-in tilt sensor), and toggle buttons for motors A and B.

## Try this
1. Click **Run on Simulator** — the LED starts green (idle).
2. Drag the tilt-X slider past 15 — the LED turns blue.
3. Drag the tilt-Y slider past 15 — the LED turns red.
4. Toggle Motor A on — the LED turns yellow.
5. Centre both sliders and toggle motors off — green again.

## What is going on
The **rgb_light** widget reads the `hub_led` variable (a 24-bit
0xRRGGBB number) and renders a coloured circle. The program maps
tilt angles and motor state to colours — the same feedback loop the
real WeDo 2.0 extension's `setLED` block provides. Tilt sliders are
INPUT widgets simulating the hub's accelerometer.
