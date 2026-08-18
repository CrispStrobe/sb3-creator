# Keyshow: a 4×4 keypad on a 7-segment digit

Press any key on the red keypad — its value (0–F) appears on the digit.
This is the real matrix-scan, not a shortcut: the program drives one row
low at a time and reads the four columns back, exactly the loop that ran
on the Prechin A2's silicon. The pin map is the A2's measured one: rows
on P1.7–P1.4, columns on P1.3–P1.0, segments on P0.

In SIM mode the keypad is clickable: a press bridges its row and column
electrically (0.1 Ω), and the scan finds it the same way real firmware
finds a real finger.
