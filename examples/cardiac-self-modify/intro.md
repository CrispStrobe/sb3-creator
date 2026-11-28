# An instruction visits three cells

Change the operand of OUT in memory to walk through three data cells.

The word at cell 10 begins as 580 (OUT 80). The program adds one to that word and stores it back at cell 10, so the next visits output cells 81 and 82. Observe 011, 022 and 033 on the output strip. The final stored instruction is 583 even though it is never executed. The source still says OUT table; a source-line association is not proof that live memory still matches.

This original exercise uses a decimal educational machine. It is not a generic Scratch, Python, JavaScript or C compilation target.
