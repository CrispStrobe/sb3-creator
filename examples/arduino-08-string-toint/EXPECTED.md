# arduino-08-string-toint — expected behaviour

## Circuit

Arduino Uno with no external components — serial output only.

## Program

Prints "String operations demo", then "Hello, World!", then its length (13). Demonstrates converting a numeric string to an integer value.

## Observable behaviour

Serial monitor shows three lines:
```
String operations demo
Hello, World!
13
```

The block version prints the test string and its length. In the original Arduino C++ example, this sketch demonstrated converting a numeric string to an integer value — the block language surfaces the subset of string operations it supports (literals, join, length).

## What this verifies

1. String literal assignment: `set testStr to "Hello, World!"`
2. `length of testStr` returns the correct count (13)
3. Serial output of string and numeric values
