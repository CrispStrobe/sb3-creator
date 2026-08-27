# CALL und RET — der Mikrocode bewegt den Zeiger

In pc115 wurde der Stapel von Hand bedient. Hier macht das der Steuerspeicher: zwei weitere Ausgangsbits, Spd und Spu, und CALL und RET sind einfach Bytezeilen wie jeder andere Befehl. Opcode 0101 einstellen und durchtakten — die Stapelzelle wird adressiert, die Rücksprungadresse kommt auf den Bus, und im letzten Schritt bewegt sich der Zeiger und die Maschine springt. 0110 ist dasselbe rückwärts, und dort bewegt sich der Zeiger ZUERST, denn die gesuchte Zelle liegt unter der, auf der er ruht. Diese Reihenfolge ist das ganze Korrektheitsargument: vertauscht man sie auf einer der beiden Seiten, wird die Rücksprungadresse aus einer nie beschriebenen Zelle gelesen. Und der Inverter ist kein Beiwerk: Eine Steuerleitung ruht LOW, die beiden Takteingänge des 74LS193 ruhen HIGH. Ohne ihn lägen beide Takte dauerhaft low, der Zeiger bewegte sich nie, und CALL wäre still ein Sprung, der vergisst, woher er kam.

**Vermittelt:** Ein Unterprogrammaufruf als Bytezeilen; warum CALL erst speichert und RET erst zurückgeht

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 6 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| step | control word |
|---|---|
| CALL T4 | Esp + Lm — address the slot |
| CALL T5 | Ep — return address on the bus |
| CALL T6 | Spd + Ei + Lp — move and jump |
| RET T4 | Spu — move FIRST |
| RET T5 | Esp + Lm |
| RET T6 | CE + Lp — read it back |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 28c256 readOnly=true, contents=0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,48,0,0,0,0,0,64,128,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,48,0,0,0,0,0,64,128,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,128,0,48,0,0,0,0,0,64,128,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,16,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,128,0,48,0,0,0,0,0,64,128,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0 |
| 1 | 28c256 readOnly=true, contents=3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,2,1,32,0,0,3,4,24,0,2,8,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,32,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,2,1,32,0,0,3,4,24,0,2,8,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0,3,4,24,32,0,0,0,0,3,4,24,2,1,32,0,0,3,4,24,0,2,8,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,32,0,0,0,0,3,4,24,32,0,0,0,0,3,4,24,2,1,32,0,0,3,4,24,0,2,8,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0 |
| 1 | 74HC00 Quad NAND |
| 1 | 74HC04 Hex NOT |
| 1 | 74LS161 4-bit Counter |
| 1 | 74ls193 |
| 3 | 4-way DIP Switch (SPST) |
| 8 | LED 2V, green |
| 10 | LED 2V, red |
| 5 | LED 2V, yellow |
| 8 | Resistor 10kΩ |
| 23 | Resistor 330Ω |

4 integrierte Schaltkreis(e), 6 Steckbrett(er), 5 V.
