# Expected behavior: eater6502-full-build

The program compiles and runs without errors. The 8 LEDs on VIA port A
count in binary from 0 to 255, wrapping around. Serial output prints
the counter value each step.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net contrast.wiper V 2.50 +-0.05
```

## Two parts are placed but not wired

`kbd` (ps2) and `bargraph` are in this bench and connect to nothing —
`kbd` has no seat and no wire at all; `bargraph` is seated on bb3 across
columns 20–29 with no other lead on those columns and no hole-wire reaching
them. bench-invariants lists both in KNOWN_UNWIRED.

They are not wired because the example contradicts itself about VIA PORT A:

| claim | source |
| --- | --- |
| bar-graph LEDs on VIA port A | `program.bw` header |
| VIA PORTA (pins 2–9): PS/2 keyboard | `intro.md` |
| `pa5`/`pa6`/`pa7` drive the LCD's `rs`/`rw`/`e` | `circuit.json` |

The third is the real Ben Eater wiring and is what the bench implements, so
only `pa0`–`pa4` are free — five pins, against a bargraph needing 20
connections (10 anodes + 10 cathodes) and a keyboard needing two. Both
documents claim the same port and neither fits.

Resolving it is an authoring decision about what this example models — move
the bargraph behind a shift register, give the keyboard `pa0`/`pa1` and drop
the bargraph claim, or remove the two parts as decorative — not a wiring job,
which is why it has been left alone rather than guessed at.
