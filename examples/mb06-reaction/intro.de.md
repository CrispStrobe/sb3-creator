---
level: beginner
age: 8+
prereqs: []
teaches: [microbit, buttons, display, variables, loops]
---

# Reaktionsspiel

Drücke Taste A so schnell du kannst, sobald der Bildschirm aufleuchtet!

## Was du siehst

Der micro:bit zählt 3 — 2 — 1 herunter, wartet einen Moment und schaltet
dann alle LEDs auf einmal an. Du hast ungefähr eine Sekunde, um Taste A so
oft wie möglich zu drücken. Am Ende erscheint „OK".

## Probiere es aus

1. Übertrage das Programm auf deinen micro:bit.
2. Beobachte den Countdown auf dem LED-Display.
3. Wenn alle LEDs aufleuchten, drücke Taste A so schnell du kannst.
4. Versuche, deinen eigenen Rekord zu schlagen.

## Was passiert hier

Das Programm nutzt eine `REPEAT 20`-Schleife mit 50 ms Pause pro
Durchlauf — das ergibt ungefähr eine Sekunde Reaktionszeit. Bei jedem
Durchlauf wird geprüft, ob Taste A gedrückt ist, und die Variable `score`
um eins erhöht. Die Pause vor dem Aufleuchten verhindert, dass du den
Moment vorhersagen kannst.

## Warum das wichtig ist

Reaktionsspiele zeigen, wie Sensoren abgefragt werden — bei jedem
Schleifendurchlauf einen Sensor (die Taste) lesen, entscheiden, handeln,
wiederholen. Genau so funktionieren echte eingebettete Systeme.

## Weiter gedacht

- Füge Taste B als zweiten Spieler hinzu und vergleiche die Punkte.
- Ändere die Anzahl der Wiederholungen, um das Zeitfenster zu verlängern.
- Zeige ein anderes Muster statt alle LEDs, um es schwerer zu erkennen.
