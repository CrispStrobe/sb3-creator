---
level: beginner
age: 10+
prereqs: [lab-astable-tone]
teaches: [astable, frequency, sound]
---
## Was du siehst
Drei Transistoren, zwei Taster und ein kleiner magnetischer Ohrhörer. Zwei der Transistoren schalten sich gegenseitig ein und aus, der dritte schaltet den Hörer.

## Probier das
1. Klick auf **Sim**. Stille: Kein Taster ist gedrückt.
2. Halte **LOW**: ein tiefer Ton im Hörer.
3. Lass los und halte **HIGH**: ein höherer Ton.
4. Halte beide zugleich: noch höher.

## Was passiert hier
Jeder Taster verbindet seinen eigenen Widerstand mit der Basis des ersten Transistors. Über diesen Widerstand lädt sich nach jedem Umschalten ein Kondensator wieder auf, und erst dann schaltet der Transistor wieder ein. Ein kleinerer Widerstand (33 kΩ bei HIGH statt 100 kΩ bei LOW) lädt schneller, die Schaltung schaltet öfter um, der Ton ist höher. Ohne Taster lädt nichts diese Basis auf: Die Schaltung bleibt stehen und still. Mehr braucht eine Zweiton-Klingel nicht.

## Weiter geht's
- [lab-npn-four-tone-keys](../lab-npn-four-tone-keys) — vier Töne aus zwei Tastern.
- [lab-astable-tone](../lab-astable-tone) — derselbe Oszillatortyp, vom Klick zum Ton.
