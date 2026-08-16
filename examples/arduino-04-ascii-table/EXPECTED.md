# arduino-04-ascii-table — expected behaviour

## Circuit

Arduino Uno with no external components — serial output only.

## Program

Prints "ASCII Table", then prints every ASCII character from 33 (!) to 126 (~), one per line, and stops.

## Observable behaviour

Serial monitor shows:
```
ASCII Table
33
34
35
...
126
```

Each line is the decimal value of one printable ASCII character, from ! (33) to ~ (126). The program runs once and stops after reaching 126.

## What this verifies

1. `repeat until thisByte > 126` loop terminates correctly
2. Sequential integer printing to serial
3. Program halts after the table is complete (does not loop forever)
