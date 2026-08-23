# Expected behaviour

- On start: rgb_light widget shows green (0x00FF00), power slider at 0, GO off, FWD/REV off.
- Set power to 75, toggle GO on: LED turns blue (0x0000FF, forward).
- Toggle FWD/REV: LED turns red (0xFF0000, reverse).
- Toggle GO off: LED returns to green.
- Power < 50 while running: LED shows dimmer variant (0x000080 or 0x800000).
