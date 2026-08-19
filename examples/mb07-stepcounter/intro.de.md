---
level: beginner
age: 10+
prereqs: []
teaches: [microbit, accelerometer, variables, edge-detection]
---

# Schrittzähler

Verwandle deinen micro:bit in einen einfachen Schrittzähler!

## Was du siehst

Befestige den micro:bit am Gürtel oder halte ihn in der Hand. Bei jedem
Schritt blinkt ein Pfeil-nach-oben-Symbol kurz auf dem Display. Das
Programm zählt jeden Schritt intern in der Variablen `steps`.

## Probiere es aus

1. Übertrage das Programm auf deinen micro:bit.
2. Halte den micro:bit aufrecht und laufe herum.
3. Beobachte, wie der Pfeil bei jedem Schritt aufblinkt.
4. Versuche zu rennen — der Pfeil sollte schneller blinken.

## Was passiert hier

Der Beschleunigungssensor misst die Beschleunigung entlang dreier Achsen.
Beim Gehen wippt der Körper auf und ab und erzeugt Spitzen auf der
Z-Achse. Das Programm prüft, ob der Z-Wert 1500 (etwa 1,5 g) übersteigt.
Eine Sperrvariable `was_high` stellt sicher, dass jede Spitze nur einmal
gezählt wird — sie springt bei der steigenden Flanke auf 1 und zurück auf
0, wenn der Wert wieder sinkt.

## Warum das wichtig ist

Flankenerkennung ist grundlegend für eingebettete Sensorik. Ohne die
Sperre würde ein einziger harter Schritt, der den Messwert mehrere
Schleifendurchläufe lang über 1500 hält, mehrfach gezählt. Das Muster —
„Schwellenüberschreitung erkennen, einmal handeln, auf Rückkehr warten" —
findet sich in Tastenentprellung, Nulldurchgangsdetektoren und
bewegungsgesteuerten Alarmanlagen.

## Weiter gedacht

- Passe den Schwellenwert (1500) für verschiedene Aktivitäten an.
- Zähle Schritte auf der X-Achse für seitliche Bewegungen.
- Zeige die Schrittzahl an, wenn Taste A gedrückt wird.
