# Expected CARDIAC observation

Original Brickwright example: cardiac-add.

- Input values: 17, 25
- Output values, in order: 42
- Terminal state: halted

Predict the accumulator after CLA and ADD, then inspect cell 82 after STO. OUT reads cell 82, not the accumulator. Try 0 + 0 and -5 + 12 as separate runs. Keep the sum within -999 through 999 for this introductory exercise; wider accumulator values and stored-word truncation are a separate machine rule.

These are expected semantic observations for this exact program and input strip. Assembly success alone does not establish that execution, a controller display, or an electrical circuit produced them.
