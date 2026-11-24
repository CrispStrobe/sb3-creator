# CP1 switch input — acceptance observations

Assembler checks: cells 0–3 are `[16,1]`, `[2,0]`, `[3,100]`, `[9,0]`. The input selector is one-based, so selector 1 addresses circuit terminal P1.0. No monitor ROM is included.

The switch fixture pulls P1.0 up through a resistor and grounds it when pressed. With a compatible user-imported ROM, predict high when released and low when pressed. Confirm the port value and display from the actual machine, after starting the teaching program at 0. Delay 100 is a requested millisecond wait; do not claim an exact polling frequency without measuring the ROM's remaining execution cost.

Expected conceptual result: the learner relates electrical level, sampled bit and displayed result. Completion is manual; button clicks and opened panes are insufficient proof.
