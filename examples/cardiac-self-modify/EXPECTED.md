# Expected CARDIAC observation

Original Brickwright example: cardiac-self-modify.

- Input values: (none)
- Output values, in order: 11, 22, 33
- Terminal state: halted

The word at cell 10 begins as 580 (OUT 80). The program adds one to that word and stores it back at cell 10, so the next visits output cells 81 and 82. Observe 011, 022 and 033 on the output strip. The final stored instruction is 583 even though it is never executed. The source still says OUT table; a source-line association is not proof that live memory still matches.

These are expected semantic observations for this exact program and input strip. Assembly success alone does not establish that execution, a controller display, or an electrical circuit produced them.
