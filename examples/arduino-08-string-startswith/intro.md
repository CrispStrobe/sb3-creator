---
level: beginner
age: 10+
prereqs: [arduino-08-string-compare]
teaches: [string-prefix, contains, input-parsing]
---
## What you see
The program prints "Hello, World!" and its length, demonstrating the concept of checking whether a string begins or ends with particular text.

## Try this
1. Use `contains` to check if "Hello, World!" contains "Hello" -- since it starts with "Hello", this will be true.
2. Check for "World!" the same way -- `contains` finds it anywhere, not just at the start.
3. Try checking for "hello" (lowercase) and see if it still matches -- case matters.

## What is going on
In Arduino C++ `startsWith()` and `endsWith()` check only the beginning or end of a string. Blocks offer `contains`, which searches everywhere. The difference matters when parsing commands: if the user types "LED on", you want to match the prefix "LED" without accidentally matching "FLED". Understanding where in the string a match occurs is key to reliable input handling.

## Go further
- [arduino-08-string-compare](../arduino-08-string-compare/) -- check the whole string instead of just the prefix.
- [arduino-08-string-indexof](../arduino-08-string-indexof/) -- find where inside the string a match appears.
- [arduino-08-string-case](../arduino-08-string-case/) -- understand why case affects matching.
