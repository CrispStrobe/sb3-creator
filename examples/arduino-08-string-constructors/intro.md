---
level: beginner
age: 10+
prereqs: []
teaches: [string-creation, type-conversion, join-operator]
---
## What you see
The program prints "Hello, World!" and its length, demonstrating how strings can be created from different sources like text, numbers, and expressions.

## Try this
1. Set a variable to a number like 42, then use `join` to turn it into the string "The answer is 42" and print it.
2. Try joining the result of a math expression (like `3 * 7`) with text -- notice the number converts automatically.
3. Create a string from the timer value and print it to see a live number become text.

## What is going on
In Arduino C++ the String() constructor can take a number, a character, or even a number with a base (like binary or hex) and turn it into text. In blocks, the `join` block handles this conversion automatically -- when you join a number with text, the number becomes part of the string. This is the starting point for every formatted output your program produces.

## Go further
- [arduino-08-string-addition](../arduino-08-string-addition/) -- join sensor data into formatted messages.
- [arduino-08-string-toint](../arduino-08-string-toint/) -- convert the other direction, from text back to a number.
- [arduino-08-string-length](../arduino-08-string-length/) -- measure the string you just created.
