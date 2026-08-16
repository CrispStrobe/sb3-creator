---
level: beginner
age: 10+
prereqs: [arduino-08-string-length]
teaches: [letter-of, character-index, string-access]
---
## What you see
The program prints "Hello, World!" and its length, showing how to work with individual characters inside a string by their position.

## Try this
1. Use `letter 1 of testStr` to print the first character, then `letter 5 of testStr` for the fifth.
2. Use a repeat loop to print every character on its own line -- you have just written a simple string scanner.
3. Try reading a position past the end of the string and see what happens.

## What is going on
The `letter N of` block is how blocks access a single character by index, equivalent to `charAt(N)` in Arduino C++. Strings are sequences of characters, and being able to pick out any one of them is how programs parse structured text. The index starts at 1 in blocks (unlike C++ where it starts at 0).

## Go further
- [arduino-08-char-analysis](../arduino-08-char-analysis/) -- examine what kind of character sits at each position.
- [arduino-08-string-substring](../arduino-08-string-substring/) -- extract a range of characters, not just one.
- [arduino-08-string-length](../arduino-08-string-length/) -- know where the string ends before you index into it.
