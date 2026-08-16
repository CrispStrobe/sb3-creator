---
level: beginner
age: 10+
prereqs: [arduino-08-string-addition]
teaches: [string-case, text-formatting, join-operator]
---
## What you see
The program prints "Hello, World!" and its length -- in the original Arduino sketch this demonstrates converting text to uppercase and lowercase.

## Try this
1. Use `join` to print the string next to an all-caps version you type by hand, so you can compare them side by side.
2. Change the greeting to all lowercase and see whether the length changes (it should not).
3. Make two variables, one uppercase and one lowercase version of the same word, and compare them with `=`.

## What is going on
Case conversion (toUpperCase / toLowerCase) is a common text operation in Arduino C++. Blocks do not have a built-in case-change block, but you can still explore the concept: uppercase and lowercase versions of the same word have the same length but are not equal when compared. This matters whenever a program needs to accept user input regardless of how it is typed.

## Go further
- [arduino-08-string-compare](../arduino-08-string-compare/) -- compare strings to see when they match.
- [arduino-08-string-replace](../arduino-08-string-replace/) -- swap characters inside a string.
- [arduino-08-char-analysis](../arduino-08-char-analysis/) -- look at individual characters.
