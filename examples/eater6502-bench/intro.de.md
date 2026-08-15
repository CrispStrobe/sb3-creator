---
level: advanced
age: 16+
prereqs: []
teaches: [6502-cpu, retro-computing, breadboard-computer]
---
## Was du siehst
Ein vollstaendiger 6502-basierter Breadboard-Computer: die CPU, ein 32 KB ROM, ein 6522 VIA fuer I/O und ein Oszillator als Taktgeber. LEDs am Ausgangsport des VIA zeigen den Zustand des laufenden Programms. Das ist ein Computer, der aus einzelnen Chips auf einem Breadboard aufgebaut ist, kein fertiges Board.

## Probier das
1. Starte die Simulation und beobachte, wie die LEDs am Ausgangsport ein Muster durchlaufen — das ist der 6502, der Maschinencode aus dem ROM ausfuehrt.
2. Verlangsame den Takt und beobachte jeden Schritt: den sich aendernden Adressbus, den Datenbus mit Opcodes und die Aktualisierung des Ausgangsports.
3. Aendere den ROM-Inhalt, um ein anderes LED-Muster auszugeben, und sieh das Ergebnis sofort.

## Was passiert hier
Der 6502-Prozessor holt Befehle aus dem ROM, ein Byte nach dem anderen, ueber Adress- und Datenbus. Der 6522 VIA bildet seine I/O-Ports in den Adressraum des 6502 ab, sodass das Schreiben an eine bestimmte Adresse die Ausgangspins setzt. Der Takt treibt jeden Schritt: jede steigende Flanke bringt die CPU um einen Zyklus voran. Mit einem langsamen Takt kann man dem Computer buchstaeblich beim Denken zusehen — jede Bus-Transaktion ist sichtbar. Das ist dieselbe Architektur wie beim Apple II und Commodore 64, auf das Minimum reduziert.

## Warum das wichtig ist
Einen Computer aus Chips auf einem Breadboard zu bauen entmystifiziert, was eine CPU tatsaechlich tut. Kein Betriebssystem, kein Bootloader, keine Abstraktion — nur ein Prozessor, der Befehle liest und Daten bewegt. Dieses Verstaendnis macht jedes hoehere Konzept (Compiler, Betriebssysteme, Programmiersprachen) greifbarer. Ben Eaters 6502-Projekt hat Tausende von Menschen auf diese Weise in die Computerarchitektur eingefuehrt.

## Weiter geht's
- [eater6502-vdp-hello](../eater6502-vdp-hello) — Videoausgabe zum 6502-Breadboard-Computer hinzufuegen.
- [z80-bench](../z80-bench) — eine andere klassische CPU auf dem Breadboard.
- Experiment: Schreibe ein kurzes Programm, das binaer auf den LEDs zaehlt — ein Byte inkrementieren und in einer Schleife an den VIA-Port ausgeben.
