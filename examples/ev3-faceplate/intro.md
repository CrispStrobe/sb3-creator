# EV3 Faceplate

The EV3 Mindstorms brick has a 178×128 monochrome LCD. This faceplate
puts the display and three navigation buttons (Up, Down, OK) on the
controller panel — no physical brick needed.

## Try this
1. Click **Run on Simulator** — the display shows "EV3 Ready".
2. Press **▼** to page through screens: Motor Status, Sensor Data.
3. Press **▲** to go back.
4. Press **OK** to select the current page.

## What is going on
The **mono_lcd** widget renders a 178×128 pixel buffer from the
`ev3_display` variable. The program cycles through pages on button
press and writes the display content. This matches the EV3
Comprehensive extension's display blocks — the same API that draws
text and shapes on the real brick's LCD.
