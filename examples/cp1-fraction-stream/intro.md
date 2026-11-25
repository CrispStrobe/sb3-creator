---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Six digits of 5/13

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Run long division for six decimal places. Each cycle multiplies the remainder by ten by addition, counts the possible subtractions of thirteen, then displays and stores the new digit. Inspect DigitA through DigitF for 3, 8, 4, 6, 1, 5.
