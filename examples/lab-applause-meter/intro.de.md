---
level: intermediate
age: 12+
prereqs: [42-diode-rectifier, pc29-capacitor-discharge]
teaches: [peak-detector, envelope-follower, attack-release, time-constant]
---
## Was du siehst
Eine Tonquelle (sie ersetzt ein verstärktes Mikrofon), ein Taster **Klatschen**, der den Ton durchlässt, zwei Dioden, ein großer Speicherkondensator und ein Transistor mit grüner LED.

## Probier das
1. Klick auf **Sim**: Stille, die LED ist dunkel.
2. Tipp einmal auf **Klatschen**: die LED blitzt auf und verblasst in etwa einer Sekunde.
3. Tipp jetzt mehrmals schnell hintereinander, wie Applaus. Die LED bleibt an und wird heller.
4. Hör auf und sieh zu, wie sie verlischt.
5. Vergrößere den 220-kΩ-Entladewiderstand: der Messer „erinnert“ sich jetzt länger.

## Was passiert hier
Der Ton ist eine Wechselspannung. Die Dioden lassen Ladung nur in eine Richtung fließen, in den Speicherkondensator, und nur, wenn der Ton laut genug ist. Das geht schnell über den kleinen 1-kΩ-Widerstand (schneller Anstieg). Entladen kann er sich nur über große Widerstände (langsames Abklingen). Ein Klatschen ergibt deshalb einen kurzen Lichtblitz, aber Klatscher, die schneller kommen, als sich der Kondensator leert, halten ihn geladen und die LED an. Aussteuerungsanzeigen an Mischpulten funktionieren genauso.

## Weiter geht's
- [lab-am-detector](../lab-am-detector) — dieselbe Idee mit Diode und Kondensator holt den Ton aus einer Radiowelle.
- [pc88-lichtorgel](../pc88-lichtorgel) — eine LED, die dem Ton direkt folgt, ohne festzuhalten.
