---
level: beginner
age: 10+
prereqs: [pc67-555-tongenerator]
teaches: [conductors, insulators, resistance, 555-timer, sensor-to-frequency]
---
## Was du siehst
Ein Tongenerator, dessen Zeitwiderstand an zwei Prüfspitzen herausgeführt ist. Was du zwischen die Spitzen hältst, bestimmt die Tonhöhe: Metall kreischt, ein Bleistiftstrich singt hoch, Obst spielt einen mittleren Ton, Haut brummt tief und Plastik bleibt stumm. Auf dem Steckbrett steht der Schalter PROBES für "etwas berührt beide Spitzen" und der Knopf MATERIAL für den Widerstand dieses Etwas.

## Probier das
1. Starte die Simulation. Die Spitzen sind getrennt: Stille, und die LED leuchtet einfach.
2. Schließ PROBES. Mit MATERIAL auf dem Startwert (47 kΩ, etwa ein Stück Obst) hörst du ungefähr 2 kHz.
3. Dreh MATERIAL auf 0 (Metall) und dann hoch Richtung 1 MΩ (trockene Haut). Der Ton sinkt, während der Widerstand steigt.
4. Echte Versuche mit einer echten Schaltung: Drück die Spitzen tiefer in einen Apfel, zeichne einen dicken und einen dünnen Bleistiftstrich, mach einen Papierstreifen nass. Sag den Ton voraus, bevor du hinhörst.

## Was dahintersteckt
Der 555 lädt seinen Kondensator über alle Widerstände zwischen +9 V und DISCHARGE. Sind die Spitzen durch etwas Leitfähiges verbunden, fließt Strom und der Chip schwingt; je mehr Widerstand im Weg ist, desto langsamer lädt er und desto tiefer der Ton: f = 1,44 / ((R_fixed + R_Probe + 2·R2) · C). Ein Isolator lässt keinen Strom durch, der Kondensator erreicht seine Schwelle nie, und es gibt keinen Ton. Viele Sensoren arbeiten genau so: Eine Größe ändert einen Widerstand, und ein Oszillator macht daraus eine Frequenz, die sich leicht zählen lässt. (Ein so gebauter "Lügendetektor" misst nur, wie feucht deine Haut ist.)

## Weiter geht's
- [lab-tone-keys](../lab-tone-keys): feste Widerstände schalten statt Materialien prüfen.
- [pc67-555-tongenerator](../pc67-555-tongenerator): der 555-Tongenerator mit festen Bauteilen.
