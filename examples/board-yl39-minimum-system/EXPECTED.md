# YL-39 minimum system — expected structure

- The circuit contains one STC MCU, one 74HC595, one four-digit display,
  eight LEDs, four buttons, one buzzer and one potentiometer.
- The LEDs remain active-low on port P1.
- Buttons remain connected to P3.2 through P3.5.
- The buzzer remains connected to P2.3.
- Loading the example must preserve all 27 parts and 48 authored wires.

This is a static board-wiring reference. It makes no claim that a program is
running or that every peripheral can be enabled simultaneously.
