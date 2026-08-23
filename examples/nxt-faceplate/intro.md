# NXT Faceplate

The NXT Mindstorms brick has a 100×64 monochrome LCD and three buttons.
This faceplate puts the display and buttons on the controller panel.

## Try this
1. Click **Run on Simulator** — the display shows "NXT 2.0".
2. Press **▶** to page through: sensor view, motor status, system info.
3. Press **◀** to go back.
4. Press **●** to select the current mode.

## What is going on
The **mono_lcd** widget (100×64) renders the `nxt_display` variable.
The program cycles through info screens using the left/right buttons.
This aligns with the NXT extension's sensor and motor blocks — touch
sensor, light sensor, motor position tracking.
