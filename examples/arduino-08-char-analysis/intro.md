---
level: beginner
age: 10+
prereqs: [arduino-08-string-length]
teaches: [character-inspection, string-length, letter-of]
---
## What you see
The program sets a test string to "Hello, World!", prints it, and prints its length -- showing how to examine individual characters and measure text.

## Try this
1. Change the test string to your name and predict the new length before running it.
2. Add a `letter N of` block to print the first and last character separately.
3. Try a string with only numbers like "12345" and check whether the length matches what you expect.

## What is going on
In Arduino C++ the CharacterAnalysis sketch inspects each character to see if it is a letter, digit, or punctuation. Blocks cannot classify characters that way, but they can measure length and pick out individual letters, which is the foundation of the same idea. Knowing how long a string is and what sits at each position is the first step toward parsing text input.

## Go further
- [arduino-08-string-chars](../arduino-08-string-chars/) -- access characters by position using letter-of.
- [arduino-08-string-length](../arduino-08-string-length/) -- focus on measuring string length.
- [arduino-08-string-compare](../arduino-08-string-compare/) -- test whether two strings match.
