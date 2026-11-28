# CrispBASIC portable source conversion — 2026-11-28

Owner: ChatGPT, continuing CrispStrobe's branch-only CrispBASIC incubation.
Branch: `feature/crispbasic-roundtrip-20261128`.
Base: `b465a543aa04aac9800635034b87e7438d62adc0`.

This lane owns the explicit portable BASIC reverse-reader mode, its canonical
pseudocode output, matching generator correctness fixes, CLI entry points and
focused tests. The default BASIC reader keeps its refusal boundary. Consumers
must inspect the new mode's runtime and Blocks capabilities; translating text
does not qualify an ordinary Scratch VM as a CrispBASIC simulator.

First saved increment fixes BBC Boolean control guards. The portable generator
uses numeric 0/1 reporters, while BBC NOT is bitwise (NOT 1 is -2, still true).
Repeat-until and numbered IF/ELSE guards now normalize the operand to BBC's
-1/0 Boolean representation before negation. Legacy generator bytes do not
change. Focused regression cases cover structured and numbered branches.

Further implementation and qualification remain on this feature branch.
Neither this lane nor its direct consumer adoption merges a default branch.
