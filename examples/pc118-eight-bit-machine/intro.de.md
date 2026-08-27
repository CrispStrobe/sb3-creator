# Acht Bit breit — und es hält eine Zahl, die vorher nicht passte

Dieselbe Maschine wie pc117, nur ist der Datenpfad doppelt so breit: zwei 74LS189 statt einem, zwei carry-verkettete 74HC283, zwei Register pro Register. Konzeptionell ändert sich nichts — der Mikrocode ist dieselbe Tabelle — und genau das sollte man einmal gesehen haben: Verbreitern ist der Teil, den man für schwierig hält, und er ist nur mehr vom Gleichen. Was sich ändert, ist der Wertebereich. Lade LDA 3, ADD 3, OUT und 100, und am Ausgang steht 200 — eine Zahl, die vier Bit gar nicht darstellen können. Der ADRESSPFAD bleibt absichtlich vier Bit breit: Ein Befehl besteht aus vier Bit Opcode und vier Bit Operand, also sind sechzehn Zellen der ganze Speicher, und ein breiterer Zähler würde ins Leere zeigen. Achte auf die eine Leitung, die aus zwei Vier-Bit-Addierern einen Acht-Bit-Addierer macht: Cout des unteren in Cin des oberen. Ohne sie überläuft das untere Nibble still und das Ergebnis ist um 16 daneben.

**Vermittelt:** Verbreitern ist mechanisch; es ändert den Bereich, nicht die Idee

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 13 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| what | value |
|---|---|
| program | LDA 3, ADD 3, OUT, data 100 |
| output | 200 — no nibble holds it |
| RAM | 2 x 74LS189 = 16 bytes |
| adder | 2 x 74HC283, carry chained |
| address path | still 4 bits — 16 cells is all there is |
| microcode | the same table as pc117 |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 28c256 readOnly=true, contents=0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 |
| 1 | 28c256 readOnly=true, contents=3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0 |
| 1 | 74HC00 Quad NAND |
| 4 | 74HC04 Hex NOT |
| 2 | 74HC08 Quad AND |
| 8 | 74HC244 Octal Tri-State Buffer |
| 2 | 74HC283 4-bit Adder |
| 2 | 74HC86 Quad XOR |
| 2 | 74LS161 4-bit Counter |
| 9 | 74LS173 4-bit Register |
| 2 | 74LS189 16x4 RAM |
| 3 | 4-way DIP Switch (SPST) |
| 8 | LED 2V, green |
| 8 | LED 2V, red |
| 15 | LED 2V, yellow |
| 8 | Resistor 100kΩ |
| 10 | Resistor 10kΩ |
| 31 | Resistor 330Ω |

32 integrierte Schaltkreis(e), 13 Steckbrett(er), 5 V.
