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

The second saved increment adds the strict explicit reverse mode, a durable
source/project runtime requirement, deliberate bidirectional CLI entry points,
and shared forward/reverse pin maps for eight additional machine families.
The focused producer suite passes 371 tests with no skips. Real C/WASM
original-versus-regenerated differential runs in the direct consumer pass six
fixtures: structured/numbered GPIO polling and canvas, authored numeric truth,
and authored MOVE/DRAW/GCOL. Text/VDU bytes and full GPIO traces are identical.
The consumer owns the permanent runtime gate and the exact producer adoption;
these local observations do not replace that integration qualification.
Neither this lane nor its direct consumer adoption merges a default branch.


A final semantic review adds explicit quote preservation in portable PRINT,
parenthesized negative math operands, a refusal for simplifications that would
discard a read, and one-copy source-marker decompilation. Twenty-four additional
accepted arithmetic/Boolean/string expressions match real WASM output and GPIO
traces. Four constant-result comparisons deliberately refuse, preserving their
observable operand evaluation instead of silently optimizing a read away.
