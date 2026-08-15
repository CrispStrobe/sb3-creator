---
level: intermediate
age: 12+
prereqs: [pc08-diode-polarity]
teaches: [freewheel-diode, inductive-kickback, protection]
---
## Was du siehst
Eine Spule, die ueber einen Schalter betrieben wird, mit einer Diode parallel dazu, die im Normalbetrieb in "falscher" Richtung zeigt. Wenn der Schalter oeffnet, bietet die Diode einen sicheren Pfad fuer den zusammenbrechenden Strom der Spule, anstatt einen schaedlichen Spannungspuls entstehen zu lassen.

## Probier das
1. Starte die Simulation mit der Freilaufdiode und beobachte die gleichmaessige Spannung am Schalter beim Oeffnen.
2. Entferne die Diode und oeffne den Schalter — beobachte den Spannungspuls, der ueber der Spule erscheint.
3. Probiere verschiedene Spulenwerte und sieh, wie groessere Spulen ohne Diode groessere Rueckschlagpulse erzeugen.

## Was passiert hier
Eine Spule widersteht Stromaenderungen. Wenn du den Strom ploetzlich unterbrichst, versucht die Spule, den Stromfluss aufrechtzuerhalten, indem sie die dafuer noetige Spannung erzeugt — potentiell hunderte Volt aus einer 5-V-Versorgung. Die Freilaufdiode gibt diesem Strom einen Pfad: er zirkuliert durch Diode und Spule und klingt allmaehlich durch den Widerstand ab, statt zu spieken. Im Normalbetrieb ist die Diode in Sperrrichtung und tut nichts.

## Warum das wichtig ist
Induktiver Rueckschlag zerstoert Transistoren, verbrennt Schaltkontakte und erzeugt elektromagnetische Stoerungen. Jeder Relais-, Magnetventil- und Motortreiber in professioneller Elektronik enthaelt eine Freilaufdiode. Sie zu vergessen ist einer der haeufigsten Anfaengerfehler und einer der zerstoererischsten.

## Weiter geht's
- [pc08-diode-polarity](../pc08-diode-polarity) — verstehe die Diodenrichtung, bevor du eine Freilaufdiode platzierst.
- [pc52-inductor-filter](../pc52-inductor-filter) — eine Spule in einer stationaeren Filterrolle.
- Experiment: Ersetze die Freilaufdiode durch eine Zener-Diode und beobachte, wie die Spannung auf die Zener-Spannung statt auf 0,7 V begrenzt wird — das laesst den Strom schneller abklingen.
