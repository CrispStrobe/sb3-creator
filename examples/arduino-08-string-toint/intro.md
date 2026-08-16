---
level: beginner
age: 10+
prereqs: [arduino-08-string-constructors]
teaches: [type-conversion, string-to-number, arithmetic]
---
## What you see
The program prints "Hello, World!" and its length, demonstrating the concept of converting text that contains digits into a number you can do math with.

## Try this
1. Set a variable to the string "42" and add 8 to it -- blocks convert it to a number automatically, giving 50.
2. Try adding 1 to the string "hello" -- what happens when the text is not a number?
3. Set a variable to "100" and use it in a `repeat N times` loop to prove it works as a real number.

## What is going on
In Arduino C++ `toInt()` converts a String like "123" into the integer 123 so you can use it in calculations. Blocks handle this conversion automatically when you use a string in a math operator, but the idea is the same. Converting strings to numbers is essential when your program reads serial input -- everything that arrives over the serial port is text, even if it looks like a number.

## Go further
- [arduino-08-string-constructors](../arduino-08-string-constructors/) -- convert the other direction, from number to string.
- [arduino-08-string-addition](../arduino-08-string-addition/) -- join numbers into formatted text output.
- [arduino-04-read-ascii-string](../arduino-04-read-ascii-string/) -- parse numbers from serial input in a real circuit.
