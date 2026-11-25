---
level: intermediate
age: 14+
prereqs: [21-resistor-led]
teaches: [mosfet, depletion-mode, constant-current-source]
---
## Was du siehst
Eine Batterie, zwei LEDs und ein MOSFET in einem Stromkreis, und kein einziger Widerstand. Beide Gates des MOSFETs sind direkt mit seiner Source verbunden.

## Probier das
1. Klick auf **Sim**. Beide LEDs leuchten, obwohl die Gates gar keine Spannung bekommen.
2. Vergleich die beiden LEDs. Leuchtet die über dem Transistor heller als die darunter?
3. Dreh die Batteriespannung auf 12 V hoch. Eine LED ohne Widerstand würde durchbrennen. Was passiert hier?
4. Dreh sie langsam herunter. Bei welcher Spannung gehen die LEDs aus?

## Was passiert hier
Dieser MOSFET ist selbstleitend: Sein Kanal leitet, sobald eine Spannung an ihm liegt, auch wenn das Gate auf Source-Potenzial liegt. Der Kanal lässt aber nur einen bestimmten Strom durch, hier einige Milliampere. Erhöhst du die Batteriespannung, nimmt der Transistor die zusätzliche Spannung einfach selbst auf, und der Strom ändert sich kaum. Das ist eine Konstantstromquelle, genau das, was eine LED braucht. In einem einzigen Stromkreis fließt überall derselbe Strom, deshalb ist es egal, ob eine LED auf der Drain- oder auf der Source-Seite sitzt.

## Weiter geht's
- [lab-mosfet-vcr](../lab-mosfet-vcr) — was passiert, wenn das Gate nicht auf Source-Potenzial liegt.
