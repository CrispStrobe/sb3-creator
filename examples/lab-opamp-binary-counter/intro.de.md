# Ein Zwei-Bit-Zähler mit Operationsverstärker-Takt

Zwei LEDs zählen binär von 0 bis 3 und fangen wieder an. Ein Operationsverstärker liefert die Taktimpulse, zwei Transistor-Flipflops zählen.

**Vermittelt:** T-Flipflop, Frequenzteiler, binäres Zählen, Übertrag

## Was zu tun ist

Klick auf **Sim**. Drück **RESET**, lass los und beobachte die zwei LEDs (Bit 1 ist die linke Stelle der Zahl, Bit 0 die rechte).

## Was du sehen solltest

- RESET: beide aus (00).
- Dann 01, 10, 11, 00 … etwa sieben Schritte pro Sekunde.

## Warum es funktioniert

Ein Flipflop aus zwei Transistoren hält einen von zwei Zuständen. Kleine Kondensatoren und Dioden lenken jede fallende Taktflanke auf den Transistor, der gerade leitet, und schalten ihn ab, also wechselt das Paar bei jeder Flanke. Das zweite Flipflop hört auf das erste und wechselt jedes Mal, wenn das erste auf 0 zurückgeht, wie der Übertrag, wenn du zu 01 eins addierst.
