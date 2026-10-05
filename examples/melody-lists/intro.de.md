---
level: intermediate
age: 10+
prereqs: [07-buzzer-siren, 11-toggle-button]
teaches: [lists, sound, procedures, events]
---
## Was du siehst
Beim Start spielt der Lautsprecher eine kurze Melodie aus sechs Tönen. Drücke den Taster, und sie erklingt noch einmal.

## Probier das
1. Hör dir die Melodie an und verfolge sie in den beiden Listen. Welche Zahl gehört zum langen letzten Ton?
2. Ändere eine Zahl in `notes` — probiere 440 — und spiele die Melodie erneut.
3. Füge einen siebten Ton hinzu: eine Zahl ans Ende von `notes` UND eine ans Ende von `lengths`. Was passiert, wenn du die zweite Liste vergisst?

## Was dahintersteckt
Eine Liste ist eine Reihe von Zahlen in fester Reihenfolge. Diese Melodie steckt in zwei Listen nebeneinander: `notes` enthält die Tonhöhe jedes Tons als Frequenz in Hertz (262 ist der Ton C, 392 ist G), und `lengths`, wie lange jeder Ton in Millisekunden dauert. `play tune` geht mit einem Zähler `i` an beiden Listen entlang: Element 1 jeder Liste, dann Element 2 und so weiter, `length of notes` Mal.

Ein Ton ist eine Rechteckschwingung: Das Programm stellt den Lautsprecher-Pin auf eine Frequenz, und ein Timer im Chip kippt den Pin von allein so oft pro Sekunde, während das Programm wartet. 0 Hz schaltet den Ton ab. Die kurze Pause zwischen den Tönen verhindert, dass zwei gleiche Töne zu einem verschwimmen.

Das zweite Skript startet von selbst, sobald der Taster gedrückt wird — ein WENN-Kopf an einem Pin.

## Warum das wichtig ist
Daten getrennt vom Code aufzubewahren, der sie benutzt, ist eine der nützlichsten Ideen beim Programmieren: Dasselbe `play tune` spielt jede Melodie, die du in die Listen schreibst. Spieluhren, Klingeltöne und Videospielmusik arbeiten alle mit solchen Notenlisten.

## Weiter geht's
- [07-buzzer-siren](../07-buzzer-siren) — zwei Töne und keine Listen.
- [random-lucky-light](../random-lucky-light) — ein weiteres Programm, das ein Tastendruck startet.
- Experiment: Lege eine dritte Liste für die Lautstärke an oder spiele die Melodie rückwärts, indem du `i` herunterzählst.
