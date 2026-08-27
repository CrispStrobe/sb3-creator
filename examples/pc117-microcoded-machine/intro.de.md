# Dieselbe Maschine, nur mit einem ROM statt der Matrix

Derselbe Rechner wie pc110, dasselbe Programm, dieselbe Antwort — und aus zehn Chips Steuerlogik sind zwei EEPROMs geworden. Schreibe LDA 3, ADD 3, OUT und 5 in die Zellen 0 bis 3, takte, und am Ausgang steht zehn, genau wie vorher. Der Datenpfad darunter ist der von pc110, Draht für Draht: derselbe Bus, dieselben Register, derselbe Addierer. Geändert hat sich nur, WOHER das Steuerwort kommt. Einen Befehlsdecoder gibt es auch nicht mehr, denn ein ROM braucht keinen — der Opcode IST ein Teil der Adresse. Der Unterschied zeigt sich erst beim nächsten Befehl: Eine Gattermatrix wächst um Gatter, ein ROM wächst um eine Zeile. Der Befehlssatz wird eine Datei, die man ändert, statt einer Platine, die man neu verdrahtet.

**Vermittelt:** Mikroprogrammiert und festverdrahtet sind dieselbe Maschine; der Unterschied kommt später

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 9 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| what | value |
|---|---|
| program | LDA 3, ADD 3, OUT, data 5 |
| output | 10, exactly as pc110 |
| control chips | 10 -> 2 |
| decoder | gone — the opcode is address bits |
| step counter | binary, not one-hot |
| microcode | 32 rows per ROM |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 28c256 readOnly=true, contents=0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,12,0,0,0,0 |
| 1 | 28c256 readOnly=true, contents=3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0 |
| 1 | 74HC00 Quad NAND |
| 3 | 74HC04 Hex NOT |
| 2 | 74HC08 Quad AND |
| 5 | 74HC244 Octal Tri-State Buffer |
| 1 | 74HC283 4-bit Adder |
| 1 | 74HC86 Quad XOR |
| 2 | 74LS161 4-bit Counter |
| 5 | 74LS173 4-bit Register |
| 1 | 74LS189 16x4 RAM |
| 2 | 4-way DIP Switch (SPST) |
| 8 | LED 2V, green |
| 4 | LED 2V, red |
| 11 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 6 | Resistor 10kΩ |
| 23 | Resistor 330Ω |

21 integrierte Schaltkreis(e), 9 Steckbrett(er), 5 V.
