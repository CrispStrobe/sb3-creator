# PRECHIN A2 learning board — expected structure

- The circuit retains the STC MCU and the complete represented peripheral set.
- Shared nets and jumper-dependent conflicts remain visible; they must not be
  silently separated to make the board look simpler.
- Loading the example must preserve all 29 parts and 123 authored wires.
- The display, matrix, keypad, memories, sensors, LCD and buzzer remain
  separately selectable and traceable.
- Every part has its own place on the canvas; no two parts overlap. Parts are
  grouped by function; placement is the only difference from the generated
  source.

This is a static board-wiring reference. It does not claim that every
peripheral may be active simultaneously or that a program is running.
