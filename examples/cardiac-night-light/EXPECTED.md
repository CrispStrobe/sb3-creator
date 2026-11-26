# Expected CARDIAC observation

Original Brickwright example: cardiac-night-light.

- Input values: 200, 500, 800, 300
- Output values, in order: 1, 0, 0, 1
- Terminal state: waiting

Input values below 500 produce 001; values equal to or above 500 produce 000. The supplied strip produces 001, 000, 000, 001, then the machine waits for another input. Numeric input and output are the CARDIAC interface. A Brickwright circuit adapter is a modern extension: its sampled input, output latch, voltage conversion and LED circuit must be inspected separately. The exercise does not claim historical GPIO or a historical electrical clock.

These are expected semantic observations for this exact program and input strip. Assembly success alone does not establish that execution, a controller display, or an electrical circuit produced them.
