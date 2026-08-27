# Acht Bit, und Flags, die die Maschine selbst ermittelt

In pc113 kamen die Flags von zwei Schaltern. Hier kommen sie tatsächlich her. Zwei 74HC283 hintereinander — der Übertrag des unteren geht in den Carry-Eingang des oberen — ergeben einen Acht-Bit-Addierer. Das Verbreitern ist der langweilige Teil, und genau das sollte man einmal gesehen haben: keine neue Idee, nur doppelt so viel davon. Die Flags sind die neue Idee, und beide sind unterschiedlich teuer. CARRY ist einfach der Cout des oberen Addierers — eine Leitung, die ohnehin schon da war. ZERO nicht: Dafür müssen alle acht Summenbits gleichzeitig Low sein, und ein NOR mit acht Eingängen verkauft niemand. Deshalb liegt hier ein 74HC688-Komparator, dessen Q-Seite auf Masse gelegt ist: Er meldet P=Q genau dann, wenn die Summe null ist — und das ist ein Zero-Flag. So kauft man ein Acht-Eingang-NOR im Laden. Der Modus-Schalter invertiert über die XOR-Bank jedes B-Bit und schiebt unten eine Eins hinein: Zweierkomplement, dieselbe Hardware subtrahiert. Die Carry-Lampe bedeutet dann "kein Borgen".

**Vermittelt:** Verbreitern ist mechanisch; ein Zero-Flag ist ein Komparator, den man kaufen kann

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 5 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| input | result |
|---|---|
| 200 + 100 | sum 44, carry |
| 255 + 1 | sum 0, carry AND zero |
| 0 - 1 | sum 255, carry clear = borrow |
| 5 - 5 | sum 0, zero, no borrow |
| zero detect | 74HC688 with Q tied low |
| adder | two 74HC283, carry chained |

## Was du brauchst

| qty | part |
|---|---|
| 2 | 74HC283 4-bit Adder |
| 1 | 74hc688 |
| 2 | 74HC86 Quad XOR |
| 5 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, green |
| 1 | LED 2V, red |
| 8 | LED 2V, yellow |
| 17 | Resistor 10kΩ |
| 10 | Resistor 330Ω |

5 integrierte Schaltkreis(e), 5 Steckbrett(er), 5 V.
