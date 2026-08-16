---
level: intermediate
age: 12+
prereqs: [arduino-07-bar-graph, arduino-01-analog-read-serial]
teaches: [led-matrix, xy-coordinates, analog-mapping, multiplexing]
---
## What you see
Two potentiometers control an X and Y position on a conceptual 8x8 grid -- the serial monitor prints the coordinates as you turn the knobs.

## Try this
1. Turn one potentiometer while holding the other still and watch only one coordinate change.
2. Try to "draw" a diagonal by turning both potentiometers at the same rate.
3. Change the multiplier from 7 to 3 to shrink the grid to 4x4 and see how the coordinates cluster.

## What is going on
An LED matrix has rows and columns. To light one pixel you activate its row and its column at the same time -- this is called multiplexing. This simplified version maps two analog inputs to X and Y coordinates on a grid, showing the core idea without needing physical matrix hardware. In a real circuit the program would scan through rows rapidly, turning on the right columns for each row, fast enough that persistence of vision makes all lit pixels appear steady.

## Go further
- [arduino-07-bar-graph](../arduino-07-bar-graph/) -- a simpler 1D version of mapping analog input to LEDs.
- [arduino-03-analog-in-out-serial](../arduino-03-analog-in-out-serial/) -- read analog input and produce proportional output.
- [arduino-01-analog-read-serial](../arduino-01-analog-read-serial/) -- the analog reading foundation both potentiometers rely on.
