# Expected CARDIAC observation

Original Brickwright example: cardiac-countdown.

- Input values: 3
- Output values, in order: 3, 2, 1, 0
- Terminal state: halted

The supplied input 003 produces 003, 002, 001, 000. The next subtraction stores -001; TAC then reaches HRS without outputting it. Try input 000 and input -001 in separate fresh runs. Explain why zero is printed and a negative starting value is not.

These are expected semantic observations for this exact program and input strip. Assembly success alone does not establish that execution, a controller display, or an electrical circuit produced them.
