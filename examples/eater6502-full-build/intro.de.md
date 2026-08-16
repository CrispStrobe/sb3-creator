---
level: advanced
age: 14+
prereqs: [eater6502-bench]
teaches: [full-build, binary-counting, bar-graph, lcd, decoupling, reset-circuit, clock-source]
---
## Was du siehst
Der vollständige Ben-Eater-6502-Breadboard-Computer wie im echten Aufbau: W65C02-CPU, 32 KB RAM (62256), 32 KB ROM (28C256), W65C22 VIA, W65C51 ACIA, zwei 74HC00-NAND-Dekodier-Gatter — plus alles, was die Minimalversion weglässt: ein 10-LED-Balkendiagramm an VIA-Port A, ein HD44780-LCD an Port B, 100-nF-Entkopplungskondensatoren pro Chip, ein Reset-Taster mit Pull-Up, eine Betriebs-LED und die 1-MHz-Taktquelle.

## Probier das
1. Starte das Programm — das Balkendiagramm zählt binär (0–255).
2. Drücke den Reset-Taster — der Zähler startet bei 0 neu.
3. Öffne das Warnungen-Panel und überprüfe die Speicherkarte: RAM $0000–$3FFF, ROM $8000–$FFFF, VIA bei $6000, ACIA bei $5000.
4. Entferne einen Entkopplungskondensator und beobachte: die Simulation läuft weiter, aber auf dem echten Breadboard verursacht das zufällige Abstürze durch Versorgungsspannungsrauschen.

## Was passiert hier
Dieser Aufbau entspricht dem physischen Breadboard-Computer des Eigentümers. Jeder Chip bekommt einen 100-nF-Bypass-Kondensator zwischen VCC und GND — diese filtern das Hochfrequenz-Schaltrauschen, das digitale ICs erzeugen.

## Warum das wichtig ist
Die Lücke zwischen „funktioniert in der Simulation" und „funktioniert auf dem Breadboard" ist fast immer die Stromversorgungsintegrität. Entkopplungskondensatoren, korrekte Reset-Schaltungen und stabile Taktquellen sind auf echter Hardware nicht optional.

## Weiter geht's
- [eater6502-bench](../eater6502-bench) — die Minimalversion zum Architekturverständnis.
- [eater6502-contention-bug](../eater6502-contention-bug) — ein absichtlicher Verdrahtungsfehler.
- [ttl-clock-module](../ttl-clock-module) — das Taktmodul, das die 1-MHz-Rechteckwelle erzeugt.
