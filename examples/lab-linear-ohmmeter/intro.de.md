---
level: advanced
age: 14+
prereqs: [lab-wheatstone-bridge]
teaches: [op-amp, constant-current, ohmmeter, linear-scale]
---
## Was du siehst
Ein Operationsverstärker, eine 1,5-V-Zelle, ein Bereichsschalter mit zwei Widerständen, ein zweiter Schalter, der den zu messenden Widerstand auswählt (einen festen „Unbekannten“ oder einen Drehknopf), und ein Messinstrument am Ausgang.

## Probier das
1. Klick auf **Sim**. Der unbekannte Widerstand ist angeschlossen, das Instrument zeigt 3,3: In diesem Bereich heißt das 3,3 kΩ.
2. Leg den Bereichsschalter um: 0,33, derselbe Widerstand in einem zehnmal größeren Bereich.
3. Schalt zurück, wähl den Drehknopf und dreh ihn langsam von seinem Anschlag weg: Der Zeiger wandert bei gleichen Drehschritten in gleichen Schritten.
4. Dreh weit auf: Der Zeiger schlägt über den Vollausschlag hinaus. Wechsle den Bereich und lies noch einmal ab.

## Was passiert hier
Der Operationsverstärker hält seinen Minus-Eingang auf Masse. Der Bereichswiderstand führt von dort zum Minuspol der Zelle, also liegen genau 1,5 V an ihm, und es fließt ein fester Strom: 1 mA durch 1,5 kΩ. Dieser Strom muss irgendwoher kommen, und der einzige Weg führt über den unbekannten Widerstand vom Ausgang des Operationsverstärkers. Also muss der Ausgang um Strom mal unbekanntem Widerstand steigen, und das Instrument zeigt es an. Doppelter Widerstand, doppelter Ausschlag: eine gerade Skala. Ein gewöhnliches Zeiger-Ohmmeter drängt die großen Werte an einem Ende zusammen, dieses nicht.

## Weiter geht's
- [lab-wheatstone-bridge](../lab-wheatstone-bridge) — einen Widerstand durch Vergleich mit bekannten messen.
- [lab-bridge-meter](../lab-bridge-meter) — wieder zwingt der Operationsverstärker einen Strom durch ein Messinstrument.
