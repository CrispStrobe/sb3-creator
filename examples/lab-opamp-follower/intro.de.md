---
level: intermediate
age: 12+
prereqs: [pc54-opamp-follower, lab-power-matching]
teaches: [voltage-follower, input-impedance, loading, buffer]
---
## Was du siehst
Zwei Kartoffel-Zellen, jede gut für 0,9 V, aber mit viel Widerstand im Inneren. Kartoffel A treibt eine 4,7-kΩ-Last direkt. Kartoffel B treibt dieselbe Last über einen Operationsverstärker, der als Spannungsfolger geschaltet ist.

## Probier das
1. Lies beide Voltmeter ab. Kartoffel A zeigt weniger als ein halbes Volt, Kartoffel B die vollen 0,9 V.
2. Berechne die Anzeige von Kartoffel A als Spannungsteiler: 5 kΩ innen, 4,7 kΩ außen.
3. Prüf den Strom aus Kartoffel B. Er ist praktisch null: Den Laststrom liefert die Batterie des Operationsverstärkers.

## Was dahintersteckt
Jede Messung nimmt dem Gemessenen etwas Strom weg. Eine Kartoffel, ein Sensor oder ein Kristall kann nur winzige Ströme liefern, also zieht eine niederohmige Last die Spannung herunter. Der Spannungsfolger ist ein Operationsverstärker, dessen Ausgang direkt auf den invertierenden Eingang zurückgeführt ist: Er stellt den Ausgang so ein, dass beide Eingänge gleich sind, und kopiert damit den Eingang mit Verstärkung 1. Sein Eingang nimmt fast keinen Strom, sein Ausgang liefert Milliampere aus der eigenen Versorgung. Deshalb sitzen Puffer zwischen schwachen Quellen und echten Lasten.

## Weiter geht's
- [lab-opamp-gain](../lab-opamp-gain): Rückkopplung mit einer Verstärkung größer als 1.
- [lab-power-matching](../lab-power-matching): derselbe Teiler-Effekt, als Leistung gemessen.
