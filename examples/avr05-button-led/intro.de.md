---
level: beginner
age: 8+
prereqs: [avr01-blink]
teaches: [button-input, digital-input, conditional-logic]
---
## Was du siehst
Ein Taster steuert eine LED. Drücke den Taster und die LED leuchtet; lasse ihn los und die LED geht aus. Das einfachste Eingang-zu-Ausgang-Programm.

## Probier das
1. Klick auf **Sim** — die LED ist dunkel (Taster nicht gedrückt).
2. Drücke den Taster. Die LED leuchtet sofort auf.
3. Lass den Taster los. Die LED geht nach dem nächsten Abfragezyklus (50 ms) aus.

## Was passiert hier
Das Programm liest in einer Schleife den digitalen Pin D2. Wenn der Taster gedrückt wird, geht D2 auf High (über den Taster auf 5 V gezogen), und das Programm schaltet Pin D13 ein. Beim Loslassen fällt D2 über den 10-kΩ-Pull-down-Widerstand auf 0 V, und die LED geht aus. Die 50-ms-Wartezeit setzt die Abfragerate — schnell genug, um sofort zu wirken, langsam genug, um die CPU nicht zu verschwenden.

## Warum das wichtig ist
Einen Taster abzufragen ist die Grundlage aller Benutzereingaben in eingebetteten Systemen. Jede Tastatur, jedes Bedienfeld und jeder Gamecontroller beginnt mit diesem Muster: Pin lesen, entscheiden, handeln.

## Weiter geht's
- [avr06-blink-and-print](../avr06-blink-and-print) — Tasterabfrage mit anderen Aufgaben kombinieren.
- [11-toggle-button](../11-toggle-button) — Toggle-Modus: einmal drücken zum Einschalten, nochmal zum Ausschalten.
- Experiment: Füge einen zweiten Taster an D3 hinzu, der unabhängig eine zweite LED steuert.
