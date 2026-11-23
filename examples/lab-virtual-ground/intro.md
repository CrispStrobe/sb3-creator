---
level: intermediate
age: 14+
prereqs: [pc02-voltage-divider, pc54-opamp-follower]
teaches: [virtual-ground, buffer, loading, reference]
---
## What you see
Two ways to make "half the battery". On the left an op-amp holds the middle point steady; on the right a plain pair of resistors tries the same. Each middle point has LEDs hanging on it.

## Try this
1. Click **Sim** and read both voltmeters.
2. Why is the right one so far from 4.5 V?
3. Put a voltmeter between the left middle point and each battery terminal. What do you read?

## What is going on
Many op-amp circuits want a supply that is symmetrical around zero. A voltage divider gives the half-way point, but only as long as nothing draws current from it: the yellow LED on the right pushes current into the middle and drags it upward. On the left the op-amp follower copies the divider's 4.5 V to its output and supplies or swallows whatever current the loads need. Call that point "ground" and your single battery becomes a ±4.5 V supply.

## Go further
- [pc54-opamp-follower](../pc54-opamp-follower) — the follower by itself.
- [pc02-voltage-divider](../pc02-voltage-divider) — the unloaded divider.
