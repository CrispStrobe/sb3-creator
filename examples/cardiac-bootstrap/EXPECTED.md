# Expected CARDIAC observation

Original Brickwright example: cardiac-bootstrap.

- Input values: 2, 800, 20, 80, 21, 180, 22, 281, 23, 680, 24, 580, 25, 900, 81, 7, 820, 35
- Output values, in order: 42
- Terminal state: halted

Start at 00 with only the fixed word 001. The first two inputs place INP 02 in cell 01 and JMP 00 in cell 02. Each subsequent address-word/data pair installs one payload word. The word 820 finally replaces cell 01 with JMP 20. The remaining input 035 enters the installed program, which adds the stored 007 and outputs 042. Follow writes to cells 01, 02, 20 through 25, 81 and 99. The input strip contains both loading instructions and program data; their role depends on execution order.

These are expected semantic observations for this exact program and input strip. Assembly success alone does not establish that execution, a controller display, or an electrical circuit produced them.
