---
level: beginner
age: 10+
prereqs: [arduino-08-string-addition]
teaches: [string-append, set-variable, incremental-building]
---
## What you see
The program prints "Hello, World!" and its length, demonstrating how a string variable can be built up by appending pieces to it.

## Try this
1. Add more `set testStr to (join testStr " extra")` blocks to grow the string step by step, printing after each one.
2. Start with an empty string and append three words one at a time -- watch the length grow.
3. Append a number to the string and notice that it becomes part of the text.

## What is going on
Appending means adding new text onto the end of an existing string. In Arduino C++ the `+=` operator does this; in blocks you use `set variable to (join variable newPart)`. This is how programs build up log messages or accumulate data into a single output line.

## Go further
- [arduino-08-string-addition](../arduino-08-string-addition/) -- join strings in a single expression instead of step by step.
- [arduino-08-string-length](../arduino-08-string-length/) -- measure how the string grows as you append.
- [arduino-08-string-replace](../arduino-08-string-replace/) -- change parts of a string after building it.
