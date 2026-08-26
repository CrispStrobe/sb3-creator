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
