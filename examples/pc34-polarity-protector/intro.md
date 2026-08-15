---
level: beginner
age: 12+
prereqs: [pc01-led-resistor, pc08-diode-polarity]
teaches: [diode, reverse-polarity-protection, forward-voltage-drop, one-way-valve]
---

## What you see

A battery, a diode, a resistor and an LED, all in one loop. The diode is the odd
one out: it does nothing useful when everything is fine. It is insurance.

## Try this

1. Click **Sim**. The LED lights at **6.18 mA**.
2. Measure across the diode: 9 V goes in, **8.24 V** comes out. It kept 0.76 V.
3. Now connect the supply backwards — set `src`'s volts from `9` to `-9`.
4. Nothing lights, and no current flows anywhere. The LED is unharmed.
5. Notice the warning the simulator raises about the LED being backwards. That is
   the circuit doing its job: something *is* backwards, and the diode caught it.

## What is going on

A diode is a one-way valve for electricity. Current can go through it in the
direction its arrow points, and not the other way. That is the whole component.

Put one in series with your circuit and you get protection for free: wire the
battery the right way round and the diode conducts, so everything works. Wire it
backwards and the diode blocks, so nothing works — and, far more importantly,
nothing breaks. LEDs, electrolytic capacitors and most chips are damaged or
destroyed by reversed supplies, and a 9 V battery clips on backwards just as
easily as forwards.

The price is step 2. A conducting silicon diode is not free: it always keeps
about 0.7 V for itself, whatever the current. Your 9 V circuit is really an 8.24 V
circuit now. On a 9 V supply that is 8 % gone; on a 3 V coin cell it would be a
quarter of everything you have, which is why designers of low-voltage gear reach
for a MOSFET instead — same protection, a few millivolts of loss, more parts.

Step 4 is worth sitting with. "Nothing happens" is the *success* case here. A
protection component is one you never see working, and the only way to know it is
there is to do something wrong on purpose.

## Why it matters

Reversed polarity is the single most common way to kill a hobby project — one
diode is the cheapest insurance in electronics. Look at any board with a barrel
jack or a battery clip and you will usually find this exact diode sitting right
behind the connector.

## Go further

- **First, if you have not:** [pc08-diode-polarity](../pc08-diode-polarity) — the
  diode on its own, both ways round.
- **Compare:** [pc31-bridge-rectifier](../pc31-bridge-rectifier) — four diodes
  that *use* the wrong polarity instead of blocking it.
- **Next:** [pc49-diode-clamp](../pc49-diode-clamp) — a diode protecting against
  voltage rather than direction.
- **Experiment:** put a second diode in series with the first and measure again.
  The LED dims, because you are now paying 1.5 V instead of 0.76 V. Protection is
  not free, and it does not stack for free either.
