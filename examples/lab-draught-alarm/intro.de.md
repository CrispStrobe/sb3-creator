# Zugluftalarm: ein selbstgeheizter PTC, ein LM386-Brückendetektor und ein Blinker

Ein kleiner Silizium-PTC-Sensor führt genug Strom, um sich über die Raumtemperatur zu erwärmen. Bewegte Luft trägt diese Wärme fort, der Sensor kühlt ab, und ein LM386 bemerkt die Änderung seines Widerstands und startet einen Blinker.

**Vermittelt:** Eigenerwärmung, Wärmeabfuhr durch bewegte Luft, Brückenschaltungen, der LM386 als Komparator, der Blinker mit zwei Transistoren

## Was zu tun ist

Klick auf **Sim** und warte etwa fünf Sekunden, bis sich der Sensor erwärmt hat und das Blinken aufhört. Stell dann den Luftstrom auf 2 m/s. Stell ihn nach ein paar Sekunden wieder auf 0.

## Was du sehen solltest

- Während des Aufwärmens: Die LEDs blinken.
- Ruhige Luft: dunkel.
- Luftstrom 2 m/s: Nach etwa einer Sekunde blinken die beiden LEDs abwechselnd.
- Luftstrom wieder 0: Ein paar Sekunden später hören sie auf.

## Warum es funktioniert

Der Sensor heizt sich mit seinem eigenen Strom, bis die erzeugte Wärme genauso schnell abgeführt wird, wie sie entsteht, etwa 25 °C über dem Raum. Bewegte Luft führt die Wärme schneller ab, also stellt sich das Gleichgewicht tiefer ein. Der Widerstand eines PTC sinkt beim Abkühlen, und dadurch steigt die Spannung am 330-Ω-Widerstand darunter. Der LM386 vergleicht sie mit der Spannung vom Poti; ist sie höher, geht sein Ausgang auf hoch und versorgt den Blinker aus zwei Transistoren.
