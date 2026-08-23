# Expected behaviour

- On start: rgb_light widget shows green (0x00FF00), tilt sliders at 0, motors off.
- Drag tilt_x > 15: LED turns blue (0x0000FF).
- Drag tilt_x < -15: LED turns blue.
- Drag tilt_y > 15: LED turns red (0xFF0000).
- Centre both tilts: LED returns to green.
- Toggle Motor A on: LED turns yellow (0xFFFF00).
- Toggle Motor A off + tilts centred: LED returns to green.
