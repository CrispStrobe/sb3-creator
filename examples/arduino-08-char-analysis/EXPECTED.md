# arduino-08-char-analysis — expected behaviour

## Circuit

Arduino Uno with no external components — serial output only.

## Program

Prints "String operations demo", then "Hello, World!", then its length (13). Demonstrates character analysis concepts.

## Observable behaviour

Serial monitor shows three lines:
```
String operations demo
Hello, World!
13
```

The program prints a demonstration string and its length (13 characters). In the original Arduino example, individual characters are analysed for type (letter, digit, punctuation); here the block version demonstrates the string-and-length primitives available in the visual language.

## What this verifies

1. String literal assignment and printing
2. `length of testStr` returns 13 for "Hello, World!"
3. Program runs once and completes (no forever loop)

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
