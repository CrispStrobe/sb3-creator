---
level: beginner
age: 10+
prereqs: [arduino-08-string-addition]
teaches: [string-comparison, contains, equals-operator]
---
## What you see
The program prints "Hello, World!" and its length, demonstrating the concept of comparing strings to check whether they match or whether one contains another.

## Try this
1. Make two variables with the same text and test them with `=` -- they should be equal.
2. Change one letter and test again -- now they are not equal.
3. Use `contains` to check whether "Hello, World!" contains "World" and print the result.

## What is going on
Comparing strings is how programs make decisions based on text input. The `=` operator checks if two strings are identical, while `contains` checks if one string appears inside another. In Arduino C++ these are `equals()` and `indexOf() != -1`. Getting comparison right matters for things like matching passwords or recognizing commands.

## Go further
- [arduino-08-string-startswith](../arduino-08-string-startswith/) -- check just the beginning of a string.
- [arduino-08-string-indexof](../arduino-08-string-indexof/) -- find where inside the string a match occurs.
- [arduino-08-string-case](../arduino-08-string-case/) -- understand why "hello" and "Hello" are not equal.
