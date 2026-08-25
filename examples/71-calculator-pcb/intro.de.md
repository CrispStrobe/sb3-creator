# Taschenrechner, auf einer Platine

Derselbe Rechner wie `70-calculator`, aber so verdrahtet, wie eine fertige
Platine verdrahtet wird — nicht so, wie man auf dem Steckbrett steckt.

Beim Steckbrett-Aufbau hat jede Taste ein Bein am GPIO und das andere an
+3V3; die internen Pull-down-Widerstände des Pico halten den Pin auf Low, bis
gedrückt wird. Gedrückt heisst HIGH.

Hier hat jede Taste ein Bein am GPIO und das andere an **GND**, und die
internen **Pull-ups** halten den Pin auf High, bis gedrückt wird. Gedrückt
heisst LOW.

Beides ist richtig. Das Zweite macht fast jede echte Platine so, denn eine
Masseflaeche liegt ohnehin unter jedem Bauteil, eine Versorgungsleitung nicht
— der kuerzere, stoerungsaermere Draht geht also nach Masse.

Im Dialekt ist das ein Wort pro Pin:

    PIN b9 = GP2 INPUT              # Tasten an +3V3, Pull-down, gedrueckt = HIGH
    PIN b9 = GP2 INPUT ACTIVE LOW   # Tasten an GND,  Pull-up,   gedrueckt = LOW

`read b9` bedeutet weiterhin "gedrueckt" — die Polaritaet steht in der
Deklaration, nicht in der Logik. Keine Zeile der Rechen-Logik aendert sich.

Die gruene LED haengt ueber einen 390-Ohm-Widerstand am geregelten 3V3 des
Pico. Sie haengt an keinem GPIO und kommt im Programm nicht vor: sie leuchtet,
sobald der Regler laeuft. Eine Betriebs-LED an einem Pin geht aus, wenn das
Programm haengt — also genau dann, wenn sie leuchten sollte.
