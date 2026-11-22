---
level: intermediate
age: 12+
prereqs: [51-555-astable, 29-capacitor-charge]
teaches: [capacitance, dielectric, non-contact-sensing, 555-timer]
---
## Was du siehst
Ein 555-Blinker, dessen Zeitkondensator aus zwei Folienstreifen außen an einem Glas besteht. Drei Schiebeschalter stehen für den Wasserstand: jeder fügt die zusätzliche Kapazität hinzu, die das Wasser zwischen den Streifen erzeugt.

## Probier das
1. Klick auf **Sim**: das leere Glas ergibt ein schnelles Blinken.
2. Füll das Glas mit den drei Schiebeschaltern Stufe für Stufe. Das Blinken wird jedes Mal langsamer.
3. Zähl bei jedem Stand die Blitze pro Sekunde. Mit der vierfachen Kapazität bekommst du ein Viertel der Rate.

## Was passiert hier
Ein Kondensator besteht aus zwei Leitern mit einem Isolator dazwischen. Wie viel Ladung er speichert, hängt von diesem Isolator ab: Wasser speichert etwa achtzigmal mehr als Luft. Steigt das Wasser zwischen den Folien, wächst also die Kapazität, obwohl das Wasser das Metall nie berührt. Der 555 lädt und entlädt seinen Zeitkondensator zwischen zwei festen Spannungen, ein größerer Kondensator braucht dafür einfach länger, und die Blinkrate verrät den Füllstand. Ein echter Sensor würde stufenlos messen; der Simulator hat keinen Drehkondensator, deshalb kommt der Füllstand hier in drei Stufen.

## Weiter geht's
- [51-555-astable](../51-555-astable) — der 555-Blinker für sich allein.
- [lab-wet-dry-probe](../lab-wet-dry-probe) — Wasser erkennen, indem man es berührt.
