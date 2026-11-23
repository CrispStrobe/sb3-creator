---
level: intermediate
age: 12+
prereqs: [38-npn-switch, 44-darlington-motor]
teaches: [darlington, current-gain, touch-switch, high-resistance-sensing]
---
## Was du siehst
Ein Taster steht für zwei Metallplatten, die du mit der Fingerkuppe überbrückst. Deine Haut ist ein Widerstand von einigen Megaohm, es fließen also nur ein paar Mikroampere. Zwei Kanäle bekommen genau diesen Strom: links ein einzelner Transistor mit roter LED, rechts zwei Transistoren in Darlington-Schaltung mit grüner LED.

## Probier das
1. Klick auf **Sim**: beide LEDs sind dunkel.
2. Drück den Berührungstaster. Die grüne LED geht voll an, die rote glimmt nur.
3. Setz beide Fingerwiderstände auf 10 MΩ (ein trockener Finger). Welcher Kanal reagiert noch?
4. Setz sie auf 220 kΩ (ein feuchter Finger): jetzt schafft es auch der einzelne Transistor.

## Was passiert hier
Ein Transistor lässt etwa den hundertfachen Basisstrom als Kollektorstrom durch. In der Darlington-Schaltung wird der Emitterstrom des ersten Transistors zum Basisstrom des zweiten, die Verstärkungen multiplizieren sich: hundert mal hundert. Aus Mikroampere werden Milliampere. Der Preis ist eine höhere Spannung über dem Transistorpaar, weil die zweite Basis-Emitter-Strecke auf dem Spannungsabfall des ersten Transistors sitzt.

## Weiter geht's
- [lab-touch-off](../lab-touch-off) — dasselbe Paar andersherum: Berühren schaltet eine Lampe aus.
- [44-darlington-motor](../44-darlington-motor) — ein Darlington an einer größeren Last.
