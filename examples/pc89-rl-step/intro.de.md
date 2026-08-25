---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge]
teaches: [inductor, time-constant, exponential-current]
---
## Was du siehst
Ein Widerstand und eine Spule in Reihe an 5 V. Wird die Versorgung eingeschaltet, springt der Strom nicht auf seinen Endwert -- er steigt exponentiell darauf zu, weil eine Spule jeder AENDERUNG des Stroms durch sie entgegenwirkt.

## Probier das
1. Schalte die Quelle von 0 V auf 5 V und beobachte, wie der Strom steigt statt zu springen.
2. Miss die Spannung ueber dem Widerstand und teile durch 100 Ohm -- das ist der Strom, und er ist am leichtesten zu messen.
3. Notiere die Zeit bis 63 % des Endstroms. Das ist eine Zeitkonstante, hier 100 Mikrosekunden.
4. Aendere den Widerstand und sage tau VORHER voraus. Hier steckt der typische Fehler: Bei einer Spule ist tau = L/R, ein groesserer Widerstand macht es also SCHNELLER -- umgekehrt als beim RC-Glied.

## Was passiert hier
Ein sich aendernder Strom durch eine Spule induziert eine Spannung, die der Aenderung entgegenwirkt. Im Einschaltmoment ist der Strom null und die Spule haelt fast die ganze Versorgungsspannung ab; mit wachsendem Strom faellt die Gegenspannung, der Widerstand uebernimmt mehr, bis sich nichts mehr aendert und die Spule nur noch ein Stueck Draht ist, das 5 V / 100 Ohm = 50 mA fuehrt. Der Strom folgt I(t) = (U/R)(1 - e^(-tR/L)).

## Warum das wichtig ist
Jedes Relais, jede Motorwicklung, jeder Hubmagnet und jeder Transformator ist eine Spule -- jede braucht Zeit bis zu ihrem Strom und wehrt sich heftig, wenn man ihn unterbricht. Der Anstieg, den du hier misst, ist die harmlose Haelfte davon; die gefaehrliche Haelfte faengt eine Freilaufdiode ab.

## Weiter geht's
- [pc56-inductor-freewheel](../pc56-inductor-freewheel) -- was beim AUSschalten passiert und welche Diode das ueberlebt.
- [pc52-inductor-filter](../pc52-inductor-filter) -- dieselben R und L mit Kondensator, was aus dem Anstieg erster Ordnung ein Schwingnetzwerk macht.
- Experiment: Sage tau fuer 220 Ohm und fuer 47 Ohm voraus und miss dann beides.
