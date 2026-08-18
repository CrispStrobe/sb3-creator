# arduino-08-string-length-trim — expected behaviour

## Circuit

Arduino Uno with no external components — serial output only.

## Program

Prints "String operations demo", then "Hello, World!", then its length (13). Demonstrates trimming whitespace and measuring the resulting length.

## Observable behaviour

Serial monitor shows three lines:
```
String operations demo
Hello, World!
13
```

The block version prints the test string and its length. In the original Arduino C++ example, this sketch demonstrated trimming whitespace and measuring the resulting length — the block language surfaces the subset of string operations it supports (literals, join, length).

## What this verifies

1. String literal assignment: `set testStr to "Hello, World!"`
2. `length of testStr` returns the correct count (13)
3. Serial output of string and numeric values

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
