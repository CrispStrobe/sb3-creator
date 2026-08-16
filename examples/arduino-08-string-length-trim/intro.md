---
level: beginner
age: 10+
prereqs: [arduino-08-string-length]
teaches: [string-length, whitespace, text-cleanup]
---
## What you see
The program prints "Hello, World!" and its length, demonstrating how whitespace affects string measurement and why trimming matters.

## Try this
1. Add spaces at the beginning and end of the string like "  Hello  " and print the length -- count the spaces.
2. Remove the spaces by hand and print the length again to see the difference.
3. Try a string that is all spaces -- what is its length?

## What is going on
In Arduino C++ the `trim()` method strips leading and trailing whitespace from a string, which changes its length. Blocks do not have a built-in trim, but you can observe the effect manually: a string with extra spaces is longer than the same text without them. Trimming matters when reading serial input, because users often accidentally include trailing newlines or spaces.

## Go further
- [arduino-08-string-length](../arduino-08-string-length/) -- measure strings without worrying about whitespace.
- [arduino-08-string-replace](../arduino-08-string-replace/) -- swap out unwanted characters.
- [arduino-08-string-substring](../arduino-08-string-substring/) -- extract just the meaningful part of a string.
