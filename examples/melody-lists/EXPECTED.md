# melody-lists -- expected behaviour

## Circuit

- A passive buzzer on the TONE pin `speaker` (P1.5 on the STC12; on other
  boards the pin the retarget assigns).
- Button `btn` on P3.2 with a pull-up; pressing connects the pin to GND
  (active-low).

## Program

`play tune` walks the two lists together. For each index i it sets the
speaker to item i of `notes` (Hz) for item i of `lengths` (ms), then
silence for 30 ms. It runs once at start and again on every press of the
button (a pin-event hat, one run per press).

## Observable behaviour

| note | frequency | starts at | lasts  |
|------|-----------|-----------|--------|
| 1    | 262 Hz    | 0 ms      | 300 ms |
| 2    | 294 Hz    | 330 ms    | 300 ms |
| 3    | 330 Hz    | 660 ms    | 300 ms |
| 4    | 262 Hz    | 990 ms    | 300 ms |
| 5    | 330 Hz    | 1320 ms   | 300 ms |
| 6    | 392 Hz    | 1650 ms   | 600 ms |

The tune ends at 2280 ms. The tone needs a timer of its own: the ATtinys
have none left and refuse the program. On the 8051 the tone timer is the
UART's, so this program does not print.
