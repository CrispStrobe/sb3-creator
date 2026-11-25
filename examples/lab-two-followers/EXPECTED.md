# lab-two-followers — expected behaviour

## Circuit
9 V. A 10 kΩ potentiometer across the supply is the input; its wiper reaches the first NPN's base through
47 kΩ (a deliberately weak source) and an ammeter. The first transistor is an emitter follower: collector
on +9 V, emitter to ground through 100 kΩ. Its emitter drives the base of a second follower (collector on
+9 V, 10 kΩ to ground). A slide switch hangs the load — 330 Ω and a red LED — on the first follower's
emitter (left) or on the second one's (right, as authored). Voltmeters on the wiper and on both emitters.

## Observable behaviour
- As authored (pot at 0.8, load on the second follower): wiper 7.20 V, first base 7.11 V, first emitter
  6.43 V, second emitter 5.75 V. Each follower hands on its input minus one base-emitter drop of about
  0.68 V: two followers in a row cost two drops.
- The LED carries about 12 mA, yet the ammeter in the base lead reads only about 1.9 µA. Each follower
  multiplies the current by its gain, so two in a row multiply it twice; the weak 47 kΩ source barely
  notices the load and it drops less than a tenth of a volt.
- Slide the switch to the first follower: now one current gain has to carry the LED. The base current
  jumps to about 59 µA, the 47 kΩ resistor drops almost 3 V, the first base sags to about 4.3 V and the LED
  current halves to about 5.9 mA, although the second follower's output would have been higher than the
  first's.
- Turning the pot down lowers every voltage by the same amount; once the wiper is below about three volts the
  second emitter sits below the LED's forward drop and the LED goes dark.

## What this verifies
1. An emitter follower's output is its input minus one junction drop; two in a row lose two.
2. The current gains of two followers multiply, so the pair can drive a load from a source that a single
   follower could not.

```assert
# pot at 0.8, load on the second follower: the 47 k source sags only 0.09 V
net potentiometer_3.wiper V 7.196 +-0.03
net npn_6.base V 7.108 +-0.03
net npn_6.emitter V 6.432 +-0.04
net npn_8.emitter V 5.745 +-0.04
```
