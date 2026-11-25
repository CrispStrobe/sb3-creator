---
level: advanced
age: 14+
prereqs: [lab-opamp-blinker, lab-toggle-flip-flop]
teaches: [flicker-fusion, astable, frequency-divider, duty-cycle, steering-diodes]
---
## What you see
A green LED that blinks, and a RATE pot. Somewhere between slow and fast the blinking turns into steady light: that point is your flicker-fusion frequency.

## What to do
1. Click **Sim** and watch the LED.
2. Turn the **RATE** pot slowly. Where does the flicker disappear for you?
3. Notice that the LED does not get brighter or darker as you turn: it is always on exactly half the time.

## What is going on
An op-amp charges and discharges a capacitor and flips each time it reaches one of two levels: a square wave, but not an even one. Two transistors after it form a flip-flop that changes state on every rising edge, so its output runs at half the frequency with equal on and off times. Steering diodes make sure each edge only reaches the transistor that is currently off.

## Go further
- [lab-flicker-fusion](../lab-flicker-fusion) — the same test with a 555 and a D flip-flop.
- [lab-toggle-flip-flop](../lab-toggle-flip-flop) — a transistor flip-flop that toggles on a button.
