---
level: beginner
age: 10+
prereqs: [arduino-08-string-chars, arduino-08-string-length]
teaches: [substring, letter-of, text-extraction]
---
## What you see
The program prints "Hello, World!" and its length, demonstrating how to extract a portion of a string by position.

## Try this
1. Use `letter 1 of testStr` through `letter 5 of testStr` in a join to extract "Hello" from the string.
2. Extract just "World" (characters 8 through 12) by joining five `letter N of` blocks.
3. Try extracting different ranges and predict what you will get before running the program.

## What is going on
In Arduino C++ `substring(from, to)` extracts a slice of a string. In blocks you use `letter N of` to get one character at a time. Extracting substrings is how programs pull meaningful data out of structured text -- for example, reading the hour from a time string like "14:30:00" by taking characters 1 through 2.

## Go further
- [arduino-08-string-chars](../arduino-08-string-chars/) -- access a single character instead of a range.
- [arduino-08-string-indexof](../arduino-08-string-indexof/) -- find where to start extracting.
- [arduino-08-string-length](../arduino-08-string-length/) -- know how far you can extract.
