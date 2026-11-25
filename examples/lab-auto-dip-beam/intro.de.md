# Automatisches Abblendlicht

Fahr mit Fernlicht, und das Auto blendet von selbst ab, sobald die Scheinwerfer eines entgegenkommenden Autos den Sensor treffen.

**Vermittelt:** Flipflop, Setzen und Rücksetzen, Fototransistor

## Was zu tun ist

Klick auf **Sim**. Drück die Taste (Fernlicht). Schieb den Regler **light** des Fototransistors auf 0,1, dann auf 0,3, dann zurück auf 0.

## Was du sehen solltest

- Das Fernlicht (blau) bleibt an, wenn du die Taste loslässt.
- Ein wenig Licht ändert nichts; das Licht des Gegenverkehrs schaltet auf Abblendlicht (grün), und es bleibt abgeblendet.

## Warum es funktioniert

Zwei über Kreuz gekoppelte Transistoren merken sich, welcher an ist. Die Taste zieht die Basis der Abblendseite herunter, also übernimmt die Fernlichtseite. Der Fototransistor sitzt an der Basis der Fernlichtseite: Bei genug Licht leitet er mehr Strom ab, als diese Basis bekommt, der Fernlichttransistor geht aus und die Abblendseite übernimmt.
