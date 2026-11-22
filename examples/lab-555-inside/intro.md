---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable, pc70-schmitt-trigger]
teaches: [555-timer, comparator, hysteresis, schmitt-trigger, flip-flop]
---
## What you see
A 555 with its timing parts taken away, so you can poke at what is inside. One knob (INPUT) feeds both comparator inputs at once. A green LED shows the output high, a red one shows it low, and a yellow one shows the discharge transistor switching.

## Try this
1. Start the simulation. INPUT sits at 1.8 V and the green LED is on.
2. Turn INPUT up slowly. Nothing happens until about 6 V, then the output drops: red and yellow come on.
3. Turn INPUT back down. The output does not flip back at 6 V. It waits until about 3 V. Those two numbers are one third and two thirds of 9 V.
4. Move the slide switch to SHIFT and turn the SHIFT knob. Repeat the sweep: both switching points move, and the lower one stays at half the upper one.
5. Hold the RESET button. The output goes low whatever INPUT says.

## What is going on
Inside the 555 three equal 5 kΩ resistors make a divider at 1/3 and 2/3 of the supply. One comparator watches THRESHOLD against the 2/3 point and resets a flip-flop; the other watches TRIGGER against the 1/3 point and sets it. Between the two points neither comparator acts, so the flip-flop keeps its last state. CONTROL is the 2/3 tap of that divider, which is why pulling on it shifts both points. In a normal astable the capacitor voltage is the "input", rising and falling between exactly these two thresholds.

## Go further
- [pc47-555-monostable](../pc47-555-monostable): the same thresholds timing one pulse.
- [pc70-schmitt-trigger](../pc70-schmitt-trigger): hysteresis from a logic gate instead.
