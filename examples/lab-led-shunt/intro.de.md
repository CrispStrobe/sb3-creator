---
level: beginner
age: 10+
prereqs: [pc04-parallel-leds, pc05-npn-switch]
teaches: [current-paths, bypass, forward-voltage, kirchhoff-current-law]
---
## Was du siehst
Drei kleine LED-Schaltungen nebeneinander. In jeder bietet ein Taster (oder ein Transistor) dem Strom einen bequemeren Weg an einer LED vorbei.

## Probier das
1. Drück BYPASS RED. Die rote LED geht aus, und die grüne LED in derselben Kette wird *heller*. Probier dann BYPASS GREEN und beide zusammen.
2. Drück ADD RED. Eine rote LED wird direkt parallel zur leuchtenden grünen geschaltet. Grün wird dunkel, Rot übernimmt.
3. Drück SHUNT. Ein winziger Basisstrom schaltet den Transistor ein, und der Transistor nimmt der gelben LED ihren Strom weg.

## Was dahintersteckt
Strom verteilt sich immer auf die Wege, die er angeboten bekommt, und ein Draht (ein geschlossener Taster) ist der bequemste Weg überhaupt. Überbrückst du eine LED in einer Reihenschaltung, fällt ihre Flussspannung aus dem Kreis heraus. Für Widerstand und zweite LED bleibt mehr Spannung, also steigt der Strom. Zwei LEDs direkt parallel sind ein unfairer Wettkampf: Die rote LED leitet schon bei kleinerer Spannung als die grüne und hält den gemeinsamen Knoten so niedrig, dass die grüne nicht mehr leuchtet. Ein Transistor parallel zu einer LED ist ein Überbrückungstaster, den ein kleiner Strom drücken kann.

## Weiter geht's
- [pc04-parallel-leds](../pc04-parallel-leds): parallele LEDs, die sich den Strom teilen, jede mit eigenem Widerstand.
- [lab-rtl-gates](../lab-rtl-gates): Transistoren, die Ausgänge herunterziehen und so Logik bilden.
