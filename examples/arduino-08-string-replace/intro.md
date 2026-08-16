---
level: beginner
age: 10+
prereqs: [arduino-08-string-indexof]
teaches: [string-replace, text-transformation, find-and-swap]
---
## What you see
The program prints "Hello, World!" and its length, illustrating the concept of replacing parts of a string with different text.

## Try this
1. Make a new string by joining pieces to simulate replacement: set result to `join (join "Hello" " Earth") "!"` to replace "World" with "Earth".
2. Start with "aabbcc" and try to build "aaddcc" using join blocks -- this is manual replacement.
3. Print the length before and after your replacement. Did it change? Why or why not?

## What is going on
In Arduino C++ the `replace()` method swaps every occurrence of one substring for another. Blocks do not have a direct replace block, but you can achieve the same result by splitting the string mentally and reassembling it with `join`. String replacement is how programs fix formatting, sanitize input, or convert between data formats.

## Go further
- [arduino-08-string-indexof](../arduino-08-string-indexof/) -- find where the text you want to replace is located.
- [arduino-08-string-substring](../arduino-08-string-substring/) -- extract the parts around what you want to replace.
- [arduino-08-string-append](../arduino-08-string-append/) -- build the replacement string piece by piece.
