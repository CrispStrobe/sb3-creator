---
level: intermediate
age: 12+
prereqs: [51-555-astable, 27-led-dice]
teaches: [randomness, toggle-flip-flop, sampling, 555-timer]
---
## Was du siehst
Ein 555-Timer als schneller Taktgeber, ein Flipflop, das bei jedem Takt umkippt, und zwei LEDs: rot für Kopf, grün für Zahl. Der Takt läuft nur, solange du den Taster hältst.

## Probier das
1. Klick auf **Sim**: Zahl liegt oben.
2. Halte **zum Werfen halten** einen Moment: beide LEDs flackern.
3. Lass los: eine LED bleibt an. Das ist dein Wurf.
4. Wirf zwanzigmal und zähl Kopf und Zahl. Kommt etwa halbe-halbe heraus?

## Was passiert hier
Solange der Taster gedrückt ist, tickt der Takt etwa dreißigmal pro Sekunde, und das Flipflop wechselt bei jedem Tick die Seite – viel zu schnell, um mitzukommen. Lässt du los, bleibt der Takt sofort stehen, und das Flipflop behält die Seite, auf der es gerade war. Welche das ist, hängt auf wenige Hundertstelsekunden genau von der Länge deines Drückens ab, und so genau ist keine Hand. Der Zufall kommt von dir, nicht von der Schaltung.

## Weiter geht's
- [27-led-dice](../27-led-dice) — derselbe Trick mit sechs Seiten.
- [lab-counter-timer](../lab-counter-timer) — vier Teilerstufen hintereinander.
