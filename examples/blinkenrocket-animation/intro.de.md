# Blinkenrocket-Animation

Blaettere durch Animationsbilder auf einem Dot-Matrix-Display —
inspiriert vom Blinkenrocket-Badge. Zwei Tasten (zurueck / weiter)
waehlen das Bild aus; das Programm schreibt jede Runde eine 32-Bit-
Maske in das Matrix-Widget.

Die Matrix hat 4 Zeilen und 8 Spalten (32 Punkte) — das Maximum fuer
den Bitmask-Vertrag des Controller-Panels (`Zeilen × Spalten ≤ 32`).
Das echte Blinkenrocket-Badge nutzt 8×18 — breitere Animationen
brauchen ein pufferbasiertes Display-Widget (zukuenftige Arbeit).

## Probiere das
1. Klicke **Im Simulator ausfuehren**.
2. Druecke **weiter**, um durch die Bilder zu blaettern: Pfeil, Herz,
   Diamant, Lachen, Schachbrett, Ring, alles an, alles aus.
3. Druecke **zurueck**, um zurueckzugehen.
4. Aendere die Bitmask-Werte im Programm, um eigene Muster zu zeichnen.

## Was passiert hier
Jedes Bild ist eine 32-Bit-Zahl — Bit `Zeile × 8 + Spalte` leuchtet
den Punkt. Das Programm speichert 8 Bilder in den Variablen `f0`–`f7`.
Die Tasten schreiben ihre Scratch-Variablen; das Programm zaehlt den
Bildindex modulo 8 hoch oder runter und schreibt die Maske nach `screen`,
die das Matrix-Widget live anzeigt.
