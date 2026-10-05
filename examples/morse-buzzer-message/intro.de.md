---
level: beginner
age: 10+
prereqs: [13-sos-morse]
teaches: [procedures, morse-code, timing]
---
## Was du siehst
Der MCU sendet das Wort HELLO im Morsecode — du hörst es am Summer und siehst es gleichzeitig an der Lampe. Kurze und lange Signale bilden jeden Buchstaben, und die Pausen dazwischen trennen Buchstaben und Wörter.

## Probier das
1. Starte das Programm und verfolge es mit der Tabelle in den Schaltungsnotizen: viermal kurz für H, einmal kurz für E und so weiter.
2. Ändere das Wort. Schlage den Morsecode deines Namens nach und buchstabiere ihn mit `dot`, `dash` und `letter gap`.
3. Mach alles schneller, indem du in den Prozeduren 0.15 durch 0.1 ersetzt — und bei den Pausen. Welche Wartezeiten müssen sich gemeinsam ändern, damit der Rhythmus stimmt?

## Was passiert hier
Morsecode baut auf einer Zeiteinheit auf. Ein Punkt dauert eine Einheit, ein Strich drei; zwischen den Zeichen eines Buchstabens ist eine Einheit Pause, zwischen Buchstaben drei und zwischen Wörtern sieben.

Statt „an, warten, aus, warten" dutzendfach zu wiederholen, definiert das Programm mit DEFINE drei kleine Prozeduren. Jeder Buchstabe ist dann nur noch eine Liste von Prozeduraufrufen — viel leichter zu lesen und zu ändern. Jede Prozedur endet mit der Pause von einer Einheit, deshalb muss eine Buchstabenpause nur noch zwei Einheiten hinzufügen.

## Warum das wichtig ist
Eine Aufgabe in kleine, benannte Teile zu zerlegen, ist die wichtigste Gewohnheit beim Programmieren. Hier wird aus einer Wand von Ein/Aus-Befehlen etwas, das sich fast wie die Morsetabelle selbst liest.

## Weiter geht's
- [13-sos-morse](../13-sos-morse) — SOS an einer LED mit einfachen WIEDERHOLE-Schleifen.
- [binary-counter-buttons](../binary-counter-buttons) — noch eine Prozedur, diesmal zum Anzeigen einer Zahl.
- Experiment: Füge eine Prozedur `word gap` hinzu und sende zwei Wörter.
