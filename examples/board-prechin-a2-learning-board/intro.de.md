# PRECHIN-A2-Lernboard

Dieses Beispiel zeigt die gemessene PRECHIN-A2-Verdrahtung als eine Schaltung:
STC89C52RC, 8×8-Matrix am 74HC595, Tastatur, achtstellige Anzeige, aktive-low
LED-Reihe, ET/XPT2046-ADC, DS1302, DS18B20, AT24C02, LCD1602, IR-Empfänger,
Summer, Taster und analoge Sensoren.

Die Schaltung ist absichtlich dicht. Dadurch werden gemeinsam benutzte Netze
und jumperabhängige Konflikte sichtbar, die kleine Demonstrationen sonst
verbergen. Vor dem Einschalten einer Peripherie sollte man ihre Netze verfolgen
und prüfen, welches andere Bauteil dieselben Pins benutzt. Erzeugt und am Board
geprüft wurde die Schaltung in `bw-circuit-ui` auf Revision
`75e3058bd2481faebe8d8272dbbc74cee06cd0dc`.

Ein Programm ist nicht enthalten. Das Board dient als Verdrahtungsreferenz oder
als Ausgangspunkt für ein gezieltes A2-Experiment.
