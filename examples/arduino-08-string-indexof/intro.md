---
level: beginner
age: 10+
prereqs: [arduino-08-string-compare]
teaches: [string-search, contains, pattern-finding]
---
## What you see
The program prints "Hello, World!" and its length, illustrating the concept of searching for text inside a string.

## Try this
1. Use `contains` to check whether "Hello, World!" contains "World" -- print "found" or "not found" based on the result.
2. Search for something that is not there, like "xyz", and confirm the result is false.
3. Search for a single character like "," to see that punctuation can be found too.

## What is going on
In Arduino C++ `indexOf()` returns the position where a substring first appears, or -1 if it is not found. Blocks use the `contains` block for the same purpose. Searching inside strings is how programs parse commands, find delimiters in CSV data, or locate keywords in user input.

## Go further
- [arduino-08-string-compare](../arduino-08-string-compare/) -- check equality instead of searching inside.
- [arduino-08-string-substring](../arduino-08-string-substring/) -- once you find something, extract part of the string.
- [arduino-08-string-startswith](../arduino-08-string-startswith/) -- search only at the beginning of the string.
