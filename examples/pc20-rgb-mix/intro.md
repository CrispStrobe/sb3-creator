---
level: intermediate
age: 12+
prereqs: [pc17-current-compare, pc04-parallel-leds]
teaches: [additive-colour, parallel-branches, per-channel-resistor]
---

## What you see

A red LED, a green LED and a blue LED, side by side, all on at once. Red and
green each have a 330 ohm resistor; blue has a 470 ohm one. If you squinted at
these three through a piece of tracing paper, you would not see three lights —
you would see one whitish one.

## Try this

1. Click **Sim**. All three light.
2. Read the currents: red **8.8 mA**, green **8.8 mA**, blue **6.3 mA**. Red
   and green agree to the last decimal, because they have identical resistors
   and identical branches.
3. Turn the mix into a colour by removing channels. Set the red branch's
   resistor to something huge — 100000 ohms — and run again. Red goes out and
   you are left with green + blue, which is **cyan**.
4. Put red back and knock out blue instead: red + green is **yellow**. Knock
   out green: red + blue is **magenta**.
5. Change the blue resistor from 470 to 330, so all three match. Every channel
   is now at 8.8 mA.

## What is going on

Mixing light is not mixing paint. Paint mixing is **subtractive** — each pigment
removes some colours from white light, so the more you add the darker it gets,
and red plus green makes a muddy brown. Light mixing is **additive**: each LED
adds its own colour on top, so the more you add the brighter it gets, and red
plus green makes **yellow**. Red plus green plus blue makes white.

That is why exactly these three colours are on the board and not some other
three. Your eye has three kinds of colour-sensitive cell, tuned roughly to red,
green and blue, and every colour you can see is some combination of how hard
those three are being tickled. Give an eye the right amounts of exactly three
lights and it cannot tell the result from the real thing. Screens have worked
this way for a century.

Which brings us to the resistors, and why blue's is different. Each branch is
independent — three separate roads off the same supply, no sharing — so each
one has its own resistor and its own current, exactly as in
[pc17-current-compare](../pc17-current-compare). Choosing those three currents
*is* choosing the colour. Here blue is deliberately run about 30 % below the
other two: real blue and white LEDs put out more visible light per milliamp
than red ones do, so leaving all three at the same current gives a mix that
looks cold and blue-heavy. Trimming per channel is how you land on a white that
actually looks white.

Step 5 undoes that trim on purpose, so you can see why it was there.

## Why it matters

Every screen you own is doing this several million times over. So is every
addressable LED strip: a NeoPixel is exactly three LEDs in one package with a
chip setting the three currents, and `(255, 200, 120)` is a person choosing
three numbers with the same reasoning you just used.

## Go further

- **Next:** [pc44-push-pull-led](../pc44-push-pull-led) — driving LEDs from
  something that can switch them, rather than leaving them on.
- **Then:** [40-led-color-mix](../40-led-color-mix) — the same mixing under
  program control, where the three levels can change over time.
- **Experiment:** aim for **orange**. Orange is red with a bit of green — try
  leaving red at 330 ohms and raising green to about 1000, so green runs at
  roughly a third of red's current. Then adjust until it stops looking yellow.
