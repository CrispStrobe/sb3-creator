---
level: beginner
age: 8+
prereqs: [05-counter-7seg]
teaches: [toggle, state-machine, debounce]
---
## Was du siehst
Drücke die Taste einmal und die LED geht an. Drücke nochmal und sie geht aus. Der MCU merkt sich den aktuellen Zustand und wechselt ihn bei jedem Druck — ein Toggle, die einfachste Zustandsmaschine.

## Probier das
1. Starte das Programm und drücke die Taste — die LED geht an und bleibt an.
2. Drücke nochmal — sie geht aus und bleibt aus.
3. Drücke mehrmals schnell hintereinander und bestätige, dass jeder Druck genau einmal umschaltet, ohne Doppel-Toggles.

## Was passiert hier
Das Programm speichert in einer Variable, ob die LED gerade an oder aus ist. Wenn es einen Tastendruck erkennt (mit dem Warte-bis-Muster — „warte bis Taste gedrückt, dann warte bis Taste losgelassen"), kehrt es die Variable um und setzt die LED entsprechend. Der Schritt „warte bis losgelassen" ist entscheidend: Ohne ihn würde das Programm bei einem langen Tastendruck viele Male umschalten, weil die Schleife tausendmal pro Sekunde läuft. Zusammen mit der Entprellung ergibt das ein sauberes, zuverlässiges Umschalten.

## Warum das wichtig ist
Toggle-Verhalten ist die Funktionsweise jedes Lichtschalters, Stummschalt-Buttons und Ein/Aus-Tasters. Das Warte-bis-Muster zur Flankenerkennung ist eine fundamentale Embedded-Technik, die verhindert, dass das Programm mehrfach auf dasselbe Ereignis reagiert. Es ist zudem die einfachste mögliche Zustandsmaschine — zwei Zustände und ein Übergang.

## Weiter geht's
- [05-counter-7seg](../05-counter-7seg) — Tastendrücke zählen statt umschalten.
- [12-dual-blink](../12-dual-blink) — zwei Ausgänge gleichzeitig steuern.
- Experiment: Füge eine Langdruck-Funktion hinzu — 2 Sekunden gedrückt halten schaltet eine zweite LED um.
