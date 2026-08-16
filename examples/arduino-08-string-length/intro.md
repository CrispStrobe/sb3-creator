---
level: beginner
age: 10+
prereqs: [arduino-08-string-constructors]
teaches: [string-length, length-of, empty-string]
---
## What you see
The program prints "Hello, World!" and then prints 13 -- the number of characters in that string, including the space, comma, and exclamation mark.

## Try this
1. Change the string and predict the new length before running it. Were you right?
2. Set a variable to an empty string "" and print its length -- it should be 0.
3. Join two strings together and check whether the combined length equals the sum of the individual lengths.

## What is going on
The `length of` block counts every character in a string, including spaces and punctuation. In Arduino C++ this is the `.length()` method. Knowing a string's length is essential for loops that process text character by character, and for checking whether a string is empty before trying to use it.

## Go further
- [arduino-08-string-length-trim](../arduino-08-string-length-trim/) -- see how removing whitespace changes the length.
- [arduino-08-string-chars](../arduino-08-string-chars/) -- use the length to loop through every character.
- [arduino-08-char-analysis](../arduino-08-char-analysis/) -- examine what those characters actually are.
