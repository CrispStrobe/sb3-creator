# Die ganze Maschine — sie führt ein Programm aus

Fünfundzwanzig Chips, ein Bus und ein Programm im Speicher. Lade vier Zellen von Hand und tu dann nichts mehr außer takten: Die Maschine holt jeden Befehl, findet heraus, was er bedeutet, und bewegt die Daten selbst. LDA lädt den Akkumulator aus dem Speicher, ADD und SUB laufen über das B-Register und den Addierer, OUT kopiert den Akku ins Ausgaberegister. Ein Befehl besteht aus zwei Bit Opcode und zwei Bit Adresse, also liegen Programm und Daten in den ersten vier Zellen. Schreibe LDA 3, ADD 3, OUT und 5 in die Zellen 0 bis 3, und am Ausgang steht zehn. Ändere nur Zelle 1 auf SUB, und dieselbe Hardware rechnet etwas anderes — genau das ist die Idee des gespeicherten Programms. Fünf verschiedene Dinge könnten diesen Bus treiben, und immer treibt ihn genau eines. Diese eine Regel, aufrechterhalten von der Steuermatrix, unterscheidet einen Computer von einem Haufen Register.

**Vermittelt:** Das gespeicherte Programm, Busdisziplin, Holen und Ausführen von Anfang bis Ende

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 9 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| memory | contents |
|---|---|
| cell 0 | LDA 3 (0011) |
| cell 1 | ADD 3 (0111) |
| cell 2 | OUT (1100) |
| cell 3 | data 5 (0101) |
| after 3 cycles | OUT shows 10 |
| cell 1 -> SUB | OUT shows 0 |
