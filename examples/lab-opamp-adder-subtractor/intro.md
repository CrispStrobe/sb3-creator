# An op-amp adder and subtractor with two knobs

Two knobs set two voltages, A and B. One op-amp adds them, another subtracts them, and two meters show the results. This is an analogue computer: it calculates with voltages instead of digits.

**Teaches:** summing amplifier, difference amplifier, analogue computing

## What to do

Click **Sim**. Hover over the knobs to read A and B. Turn **A** and **B** and compare the **SUM** and **DIFFERENCE** meters with your own sums.

## What you should see

- At the start A = 1.8 V and B = 0.9 V: the sum meter shows 2.7, the difference meter 0.9.
- Every setting: sum = A + B, difference = A − B.
- If B is bigger than A, the difference meter stays at zero.

## Why it works

Two equal resistors from A and B to one point put that point at the average of A and B. An amplifier with gain 2 turns the average into the sum. The difference amplifier lets A push its output up and B pull it down by the same amount. Running on a single 9 V battery, the op-amp cannot make negative voltages, which is why a negative difference shows as zero.
