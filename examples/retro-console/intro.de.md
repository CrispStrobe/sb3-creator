---
level: Einsteiger
age: 8+
prereqs: []
teaches: [Variablen, Bedingungen, Steuerfeld, Matrix-Widget, D-Pad, Bitmaske]
---

## Retro-Konsole (Zwei Matrizen)

Eine kleine Retro-Spielkonsole auf dem Steuerfeld — zwei 4x4-Punktmatrizen,
ein D-Pad und zwei Tasten.

Die linke Matrix ist der Spielbildschirm: ein Punkt, den du mit dem D-Pad
bewegst. Die rechte Matrix zeigt den Status: ein Balken fuer deine Leben.
Druecke FIRE, um eine Spur zu hinterlassen. Druecke START zum Zuruecksetzen.

## Probiere das

1. Klicke auf die gruene Flagge.
2. Bewege den Punkt mit dem D-Pad ueber das 4x4-Spielfeld.
3. Druecke FIRE, um Zellen zu markieren — baue ein Muster!
4. Druecke START, um alles zu loeschen und neu zu starten.
5. Beobachte die Statusanzeige: die obere Reihe zeigt deine restlichen Leben.

## Was passiert hier

Beide Matrizen lesen aus getrennten Variablen (`game_screen` und
`status_screen`). Jede Variable ist eine 16-Bit-Maske — Bit `Zeile*4+Spalte`
steuert einen Punkt. Das Programm berechnet beide Masken jeden Takt basierend
auf Position, Spur und Lebenszaehler.
