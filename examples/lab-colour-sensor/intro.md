# Telling red from green with red light

A red LED lights a surface and a phototransistor beside it catches what comes back. A red surface reflects plenty of red light, a green one hardly any, and a transistor switches an indicator accordingly.

**Teaches:** reflection and colour, why a colour sensor needs the right light

## What to do

Click **Sim**: the surface is red and the indicator is on. In the inspector, set the light path's `surface` to green, blue, black or white. Then change the LED's colour to ir and try red and green again.

## What you should see

- Red or white surface: indicator on (meter about 1.9 V on red).
- Green, blue or black: indicator off (about 0.4 V on green).
- With the infrared LED, red and green look the same.

## Why it works

A surface looks red because it reflects red light and swallows the rest. Red light shone on a green surface is mostly swallowed. Infrared, which we cannot see, is reflected by red and green dyes alike, so it cannot tell them apart.
