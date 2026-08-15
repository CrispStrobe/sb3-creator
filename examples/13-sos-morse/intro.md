---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [morse-code, timing-patterns, encoding]
---
## What you see
An LED blinks the SOS distress signal in Morse code: three short flashes, three long flashes, three short flashes, then a pause before repeating. The timing encodes information — a dash is three times longer than a dot.

## Try this
1. Run the program and count the flashes: 3 short, 3 long, 3 short.
2. Change the dot duration from its current value to something longer, like 400 ms, and watch the whole pattern slow down proportionally.
3. Try encoding a different letter — the letter "A" is one dot followed by one dash.

## What is going on
Morse code encodes letters as sequences of short signals (dots) and long signals (dashes). A dash lasts three times as long as a dot. Between dots and dashes within a letter, the LED is off for one dot-length. Between letters the gap is three dot-lengths, and between words it is seven. SOS was chosen as the universal distress signal because its pattern is unmistakable and easy to send even under stress.

## Why it matters
This is your first project where timing carries meaning. The LED is either on or off — the same two states as blink — but now the duration of each state encodes information. That principle underlies serial communication, PWM, and every digital protocol.

## Go further
- [01-blink](../01-blink) — the simpler starting point with a single steady rhythm.
- [14-traffic-light](../14-traffic-light) — another timed sequence, this time with three outputs.
- Experiment: encode your initials in Morse and flash them. Look up the Morse alphabet and build the pattern from dots and dashes.
