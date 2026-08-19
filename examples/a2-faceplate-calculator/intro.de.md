---
level: Einsteiger
age: 8+
prereqs: []
teaches: [Variablen, Bedingungen, Steuerfeld, Tastenfeld, LCD-Anzeige]
---

## A2-Taschenrechner (Bedienfeld)

Ein Kettenrechner, der komplett auf dem Steuerfeld lauft — keine
Schaltung noetig. Das 4x4-Tastenfeld ersetzt die rote Tastenmatrix des
A2-Boards, und die LCD-Anzeige ersetzt die 8-stellige 7-Segment-Anzeige.

## Probiere das

1. Klicke auf die gruene Flagge.
2. Druecke Zifferntasten auf dem Tastenfeld (7 8 9 / 4 5 6 * 1 2 3 - 0 . = +).
3. Druecke **=** zum Berechnen. Das LCD zeigt das Ergebnis.
4. Druecke **C** zum Loeschen.
5. Probiere **DEL** zum Rueckgaengig und **+/-** zum Negieren.

## Was passiert hier

Das Tastenfeld schreibt das Label der gedrueckten Taste in die Variable
`key_input`. Das Programm liest diese Variable in jedem Takt, baut den
Ausdruck auf und schreibt den Wert in `lcd_text`. Das LCD liest `lcd_text`
und zeigt es an — keine Hardwareabtastung, keine 7-Segment-Schriftart,
nur Variablen im Steuerfeld.
