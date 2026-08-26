# NICHT-Gatter: der Inverter (74HC04)

Ein 74HC04-Inverter. Schalter offen, LED an; Schalter geschlossen, LED aus. Das erste Gatter, das etwas tut, was ein Draht nicht kann.

**Vermittelt:** Invertierung, Low-aktives Denken

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Alles sitzt auf einem Steckbrett.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| A | LED |
|---|---|
| 0 | ON |
| 1 | off |
