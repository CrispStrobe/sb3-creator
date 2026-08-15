---
level: intermediate
age: 14+
prereqs: []
teaches: [6502-basics, via-gpio, retro-computing]
---
## Was du siehst
Eine LED an VIA-Port A Bit 0 (PA0) blinkt einmal pro Sekunde. Das ist das einfachste Programm für den 6502-Breadboard-Computer — das „Hello World" des Retro-Computing.

## Probier das
1. Starte das Programm und beobachte die LED mit 1 Hz blinken.
2. Ändere die Wartezeit auf 0,1 Sekunden — das Blinken wird schneller.
3. Füge eine zweite LED an PA1 hinzu und lass sie abwechselnd blinken.

## Was passiert hier
Die 6502-CPU schreibt in das Ausgangsregister des W65C22 VIA an Adresse $6000. Bit 0 auf HIGH setzt PA0 auf 5 V (durch Widerstand und LED nach Masse). Auf LOW schaltet die LED aus.

## Warum das wichtig ist
Das ist der Startpunkt für jedes Retro-Computer-Projekt. Wenn die LED blinkt, läuft die CPU, die Adressdekodierung funktioniert und der VIA antwortet.

## Weiter geht's
- [eater6502-bench](../eater6502-bench) — der vollständige Breadboard-Computer mit RAM, ROM und Adressdekodierung.
- [eater6502-contention-bug](../eater6502-contention-bug) — eine Verdrahtungsfehler-Übung.
