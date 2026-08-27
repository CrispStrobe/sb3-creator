# Das Steuer-ROM — ein Steuerwort, das man programmieren kann

Dieselbe Steuertabelle wie in pc106, und kein einziges Gatter berechnet sie. Vier Schalter sind der Opcode, ein 74LS161 zählt die sechs Schritte, und zusammen ADRESSIEREN sie zwei EEPROMs, deren Inhalt das Steuerwort IST. Der Unterschied ist der Punkt der Übung. Die Gattermatrix braucht für jeden neuen Befehl neue Gatter und wächst wie Befehle mal Zustände; das ROM braucht neue BYTES. Genau deshalb sind SAP-2, SAP-3 und jede echte CPU danach mikroprogrammiert. Achte auf den Zähler: Der Ringzähler aus pc104 sagt mit einer leuchtenden Leitung, WELCHER Zustand gerade gilt — eine ROM-Adresse will aber eine ZAHL. Deshalb steht hier ein Binärzähler. Zwölf Steuerleitungen passen nicht in ein Byte, also liegen zwei ROMs am selben Adressbus, genau wie in einem echten Aufbau. Die Holphase steht für alle sechzehn Opcodes im ROM, auch für die, die nichts bedeuten: Holen kann nicht davon abhängen, welchen Befehl die Maschine noch nicht gelesen hat. Stelle einen unbekannten Opcode ein, und die Maschine holt ihn ordentlich und tut dann nichts.

**Vermittelt:** Mikrocode: das Steuerwort wird geholt, nicht berechnet — warum echte CPUs mikroprogrammiert sind

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 4 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| step | control word |
|---|---|
| T1 | Ep, Lm — every opcode |
| T2 | Cp |
| T3 | CE, Li |
| T4 (LDA/ADD/SUB) | Ei, Lm |
| T4 (OUT) | Ea, Lo |
| T5 (ADD) | CE, Lb |
| T6 (SUB) | Eu, La, Su |
| unknown opcode | fetches, then nothing |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 28c256 readOnly=true, contents=0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0 |
| 1 | 28c256 readOnly=true, contents=3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0 |
| 1 | 74HC00 Quad NAND |
| 1 | 74LS161 4-bit Counter |
| 2 | 4-way DIP Switch (SPST) |
| 7 | LED 2V, green |
| 4 | LED 2V, red |
| 4 | LED 2V, yellow |
| 5 | Resistor 10kΩ |
| 15 | Resistor 330Ω |

2 integrierte Schaltkreis(e), 4 Steckbrett(er), 5 V.
