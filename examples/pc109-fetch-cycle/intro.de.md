# Der Holzyklus — einen Befehl lesen und verstehen

Drei Zeitschritte, und am Ende hält die Maschine einen Befehl, den sie versteht. T1: Der Programmzähler treibt den Bus, das Adressregister übernimmt die Adresse. T2: Der Zähler geht weiter — gefahrlos, denn die Adresse ist schon gesichert. T3: Das RAM treibt den Bus, das Befehlsregister übernimmt, und der Dekoder macht sofort eine leuchtende Lampe daraus: LDA, ADD, SUB oder OUT. Ein Befehl ist hier vier Bit breit — die oberen zwei sind der Opcode, die unteren zwei die Adresse, auf die er wirkt — mehr kann ein Vier-Bit-Bus ehrlicherweise nicht tragen. Erst mit den Datenschaltern und WRITE ein Programm laden, dann takten und zusehen. Achte darauf, dass immer nur EIN Treiber aktiv ist: der Zähler bei T1, das RAM bei T3, bei T2 niemand. Genau diese Regel hält das Steuerwerk aufrecht.

**Vermittelt:** Ablauf des Holzyklus, gelatchte gegen transparente Register, immer nur ein Treiber

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 6 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| state | what happens |
|---|---|
| T1 | counter drives bus, MAR latches |
| T2 | counter advances, bus idle |
| T3 | RAM drives bus, IR latches |
| 0111 | decodes ADD |
| 1100 | decodes OUT |

## Was du brauchst

| qty | part |
|---|---|
| 2 | 74HC04 Hex NOT |
| 1 | 74HC08 Quad AND |
| 1 | 74HC138 3-to-8 Decoder |
| 2 | 74HC244 Octal Tri-State Buffer |
| 1 | 74LS161 4-bit Counter |
| 2 | 74LS173 4-bit Register |
| 1 | 74LS189 16x4 RAM |
| 1 | CD4017 Decade Counter |
| 2 | 4-way DIP Switch (SPST) |
| 6 | LED 2V, green |
| 5 | LED 2V, red |
| 8 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 6 | Resistor 10kΩ |
| 19 | Resistor 330Ω |

11 integrierte Schaltkreis(e), 6 Steckbrett(er), 5 V.
