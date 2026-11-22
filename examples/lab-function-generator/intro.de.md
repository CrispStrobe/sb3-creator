---
level: advanced
age: 14+
prereqs: [pc70-schmitt-trigger, pc54-opamp-follower]
teaches: [integrator, schmitt-trigger, hysteresis, oscillator]
---
## Was du siehst
Zwei LEDs: Die rote blinkt hart an und aus, die gelbe atmet sanft auf und ab — im selben Takt. Sie zeigen eine Rechteck- und eine Dreieckspannung aus einer Schaltung.

## Probier das
1. Klick auf **Sim** und beobachte beide LEDs.
2. Setz Oszilloskop-Tastköpfe an beide Operationsverstärker-Ausgänge. Wo kehrt das Dreieck um?
3. Dreh das Potentiometer. Beide Kurven werden gemeinsam schneller oder langsamer.

## Was passiert hier
Der erste Operationsverstärker ist ein Integrierer: Solange sein Eingang tief ist, steigt der Ausgang gleichmäßig, ist er hoch, fällt er. Der zweite ist ein Schmitt-Trigger: Er kippt nur, wenn das Dreieck eine obere oder untere Grenze erreicht, und sein Ausgang steuert den Integrierer. Also steigt das Dreieck, bis der Trigger kippt, und fällt, bis er zurückkippt — immer weiter. Jeder Funktionsgenerator im Labor beginnt mit diesem Paar.

## Weiter geht's
- [pc84-led-herz](../pc84-led-herz) — LEDs an einer Schaltung derselben Art.
- [lab-v-to-f](../lab-v-to-f) — dasselbe Paar als Spannungs-Frequenz-Wandler.
