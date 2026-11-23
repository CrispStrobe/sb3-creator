---
level: advanced
age: 12+
prereqs: [lab-transistor-flip-flop]
teaches: [toggle, t-flip-flop, memory, debounce]
---
## Was du siehst
Ein Flipflop mit einer roten und einer grünen LED, einem Kondensator und zwei Tastern. Jeder Druck auf einen der beiden Taster tauscht die Farben, wie bei einem Ein-Aus-Druckschalter.

## Probier das
1. Klick auf **Sim**: Grün leuchtet.
2. Drück einen Taster und lass los. Rot. Noch einmal. Grün.
3. Nimm den anderen Taster. Er macht genau dasselbe: Du kannst von beiden Enden schalten, wie bei einer Treppenhausschaltung.
4. Drück zweimal sehr schnell hintereinander. Der zweite Druck bewirkt nichts.
5. Halte einen Taster gedrückt. Das Licht wechselt einmal und bleibt dann.

## Was passiert hier
Die beiden Transistoren speichern ein Bit, wie beim einfachen Flipflop. Der zusätzliche Kondensator folgt langsam der Spannung am Kollektor von Q1 und hält deshalb immer das Gegenteil dessen, was Q1 gerade tut: geladen, solange Q1 aus ist, leer, solange Q1 an ist. Ein Tastendruck verbindet den Kondensator mit der Basis von Q1. Ist Q1 aus, schaltet die Ladung ihn ein; ist Q1 an, zieht der leere Kondensator die Basis herunter und schaltet ihn aus. Danach braucht der Kondensator einen Moment, um dem neuen Zustand zu folgen. Deshalb zählen zwei sehr schnelle Drücke nur einmal. Ein Programm erledigt das mit einer Zeile, `toggle`, plus einer Entprell-Pause.

## Weiter geht's
- [lab-transistor-flip-flop](../lab-transistor-flip-flop) — derselbe Speicher mit getrennten SET- und RESET-Tastern.
- [11-toggle-button](../11-toggle-button) — dieselbe Aufgabe in Software.
