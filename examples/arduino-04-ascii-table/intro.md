---
level: beginner
age: 10+
prereqs: []
teaches: [ascii, character-codes, serial-print, loop]
---
## What you see
The serial monitor fills with numbers from 33 to 126 — the printable ASCII character codes.

## Try this
1. Run the program and watch the table scroll past.
2. Change the start from 33 to 65 to print only uppercase letters (65-90).
3. Change the end from 126 to 57 to print only digit codes (48-57).

## What is going on
ASCII assigns a number to every printable character: A is 65, Z is 90, 0 is 48. The program counts from 33 to 126 and prints each number. This is the lookup table every serial protocol is built on.

## Go further
- [arduino-08-string-toint](../arduino-08-string-toint) — convert between strings and numbers.
- [arduino-08-char-analysis](../arduino-08-char-analysis) — examine characters in a string.
