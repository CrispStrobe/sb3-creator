# arduino-08-string-constructors — expected behaviour

## Circuit

Arduino Uno with no external components — serial output only.

## Program

Prints "String operations demo", then "Hello, World!", then its length (13). Demonstrates creating strings from different data types.

## Observable behaviour

Serial monitor shows three lines:
```
String operations demo
Hello, World!
13
```

The block version prints the test string and its length. In the original Arduino C++ example, this sketch demonstrated creating strings from different data types — the block language surfaces the subset of string operations it supports (literals, join, length).

## What this verifies

1. String literal assignment: `set testStr to "Hello, World!"`
2. `length of testStr` returns the correct count (13)
3. Serial output of string and numeric values
