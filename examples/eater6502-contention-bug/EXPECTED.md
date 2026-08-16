# eater6502-contention-bug — expected behaviour

## Circuit
The same 6502 breadboard computer as eater6502-bench — W65C02 CPU, 32K RAM (62256), 32K ROM (28C256), W65C22 VIA, W65C51 ACIA, and two 74HC00 NAND gate chips for address decoding — but with a deliberate wiring error. The VIA's chip-select pin CS2B is wired directly to GND instead of to the glue-logic NAND output (glue1.4y) that should gate it. This forces CS2B permanently LOW (active), removing the upper address bit guard from the VIA's select logic.

## Program
There is no program file for this example. It is a static circuit analysis lesson — the bug is in the wiring, not in software. The extractor analyses the address decode at load time.

## Observable behaviour
- **On load:** the Warnings panel immediately reports a **bus contention** error. The error message names the conflicting address (e.g., "$2000") and identifies the two chips that both claim it (RAM and VIA).
- **No LEDs, no running code.** This example is not about program execution — it is about reading and fixing a wiring error before any code runs.
- **The error is specific:** it does not say "something is wrong." It says which two chips collide and at what address, the way a logic analyser would show overlapping chip-select assertions.

### The diagnosis
With CS2B tied to GND, the VIA responds whenever CS1 (wired to A13) is HIGH — that is, for any address where bit 13 is set. This includes $2000-$3FFF and $6000-$7FFF. Meanwhile, the RAM is selected for $0000-$5FFF by the NAND decode. The overlap is $2000-$3FFF: both the RAM and the VIA drive the data bus at those addresses simultaneously.

On real hardware this is a short circuit between two output drivers — potentially destructive. The simulation catches it before any current flows.

### The fix
Reconnect VIA.CS2B from GND to glue1.4y (the NAND gate output that combines NOT(A15) and A14). After the fix:
- VIA responds only at $6000-$7FFF (A15=0, A14=1, A13=1).
- RAM responds at $0000-$5FFF (no overlap with the VIA).
- The bus contention warning disappears.

## What this verifies
- **Bus contention detection:** the address-decode extractor evaluates every chip's select condition across all 65536 addresses and flags any address claimed by two or more bus drivers.
- **Actionable error messages:** the warning names the address and the colliding chips, not just "error."
- **Chip-select logic understanding:** the learner must trace the NAND gate wiring to understand why CS2B tied to GND expands the VIA's address range into RAM territory.
- **The difference between "looks fine" and "works correctly":** the breadboard appears identical to the working version — only the address map reveals the conflict.
