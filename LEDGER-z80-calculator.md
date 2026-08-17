# Z80 Calculator Retarget — Blocker Ledger

## Status: retargetPseudocode refuses — not enough input pins

### Symptom

`SB3Creator.retargetPseudocode(calculatorSrc, 'z80')` returns `ok: false`
with reason: `"more input pins than z80's convention offers (8)"` × 9.

### Root cause

The 70-calculator program uses **17 input pins** (10 digit keys + 4 operators
+ exe + clr + ac). The Z80 bench's RETARGET_POOLS declares only **8 input
pins** (`IN0`–`IN7`), because the current bench has a single 74HC244 IN buffer
on I/O port 0.

The 6502 calculator solves this with a **4×4 matrix keypad** (4 row outputs on
PA2-PA5, 4 column inputs on PB0-PB3 = 16 keys from 8 pins). The Z80 bench
would need the same approach, but:

1. The Z80 bench currently has **one port** (port 0) shared between OUT latch
   and IN buffer. A matrix keypad needs both output and input on the same scan
   cycle — the current model supports this (OUT sets rows, IN reads columns).

2. But the retarget pool model allocates pins as **flat lists** (`digital[]` for
   outputs, `input[]` for inputs). A matrix keypad's pins serve **dual roles**
   (row pins are outputs during scan, but the retargeter sees only one role per
   pin). The retargeter would need to understand that 4+4 pins give 16 keys.

### What works today

- `DEVICE Z80` + simple programs (blink, LED patterns) → `generateC()` → C →
  `sdcc -mz80` → **compiles, zero errors**.
- The Z80 STC_PARTS, RETARGET_POOLS, SPOKEN entries, pin parser, `z80Hw()`,
  shadow-byte OUT, IN reads, busy-loop delay — all verified.

### Smallest failing input

```
DEVICE Z80
CLOCK 1000000
PIN k0 = IN0 INPUT
PIN k1 = IN1 INPUT
PIN k2 = IN2 INPUT
PIN k3 = IN3 INPUT
PIN k4 = IN4 INPUT
PIN k5 = IN5 INPUT
PIN k6 = IN6 INPUT
PIN k7 = IN7 INPUT
PIN k8 = IN0 INPUT   ← DUPLICATE: 9th input, only 8 available → refusal
```

### What the compile-green slice delivers

A Z80 OLED program that compiles under sdcc -mz80: uses 2 output pins (SDA/SCL
on OUT0/OUT1), reads 4 input pins (IN0-IN3), displays a counter. This proves
the Z80 C flavor end-to-end without requiring 17 inputs.

### Path to the full calculator

1. Add a second I/O port to the Z80 bench (a second 74HC374/74HC244 pair on
   port 1), OR implement matrix keypad scanning in the emitter (OUT row pins +
   IN column pins on the same port 0).
2. Expand RETARGET_POOLS for z80 to reflect the wider pin set.
3. The retarget system itself works — it's the pin count that blocks.
