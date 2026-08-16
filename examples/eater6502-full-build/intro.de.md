---
level: advanced
age: 14+
prereqs: [eater6502-bench]
teaches: [full-build, binary-counting, bar-graph, lcd-4bit, ps2-keyboard, acia-serial, decoupling, reset-circuit]
---
## Was du siehst
Der vollständige Ben-Eater-6502-Breadboard-Computer mit der BeebEater-Peripherie-Verdrahtung: W65C02-CPU, 16 KB RAM (62256, untere Hälfte), 32 KB ROM (28C256), W65C22 VIA mit HD44780-LCD im 4-Bit-Modus an PORTB und PS/2-Tastatur an PORTA, W65C51 ACIA mit 115200 Baud und 1,8432-MHz-Quarz, zwei 74HC00-NAND-Dekodier-Gatter, Entkopplungskondensatoren pro Chip, Reset-Taster, Balkendiagramm-Status-LEDs und 1-MHz-Taktoszillator.

Dieselbe Schaltung, auf der BeebEater (chelsea6502, MIT) läuft — und später das lieferbare MIT-MS-BASIC-ROM.

## Probier das
1. Starte das Programm — das Balkendiagramm zählt binär am VIA-Port-A-Ausgang.
2. Drücke Reset — der Zähler startet bei 0 neu.
3. Prüfe das Warnungen-Panel: RAM $0000–$3FFF, ROM $8000–$FFFF, VIA $6000, ACIA $5000.

## Was passiert hier
Die Peripherie-Verdrahtung folgt der BeebEater-Konvention (chelsea6502/BeebEater, MIT):
- **VIA PORTB** (Pins 10–16): HD44780-LCD im 4-Bit-Modus. PB7 muss auf GND gelegt werden, wenn das LCD nicht angeschlossen ist.
- **VIA PORTA** (Pins 2–9): PS/2-Tastatur. Die Taktflanke der Tastatur löst über CA1 einen Interrupt aus.
- **ACIA**: 115200-Baud-Seriell bei $5000, angetrieben von einem 1,8432-MHz-Quarz.

**Errata aus den KiCad-Schaltplänen** (tebl/BE6502, MIT): der echte Aufbau braucht eine dedizierte Reset-Schaltung mit Kondensator für die Einschaltverzögerung sowie Pull-Ups an den Bus-Steuerleitungen (RWB, BE). Die Bus-Trace-Ansicht des Debuggers ist das Software-Äquivalent von tebls Arduino-Mega-Busmonitor-Shield.

## Warum das wichtig ist
Diese Schaltung ist die Plattform für BBC BASIC, Forth und schließlich ein vollständiges Betriebssystem.

## Weiter geht's
- [eater6502-bench](../eater6502-bench) — die Minimalversion zum Architekturstudium.
- [eater6502-contention-bug](../eater6502-contention-bug) — eine fehlerhafte Adressdekodierung debuggen.
- [ttl-clock-module](../ttl-clock-module) — das Taktmodul bauen, das diese CPU antreibt.
