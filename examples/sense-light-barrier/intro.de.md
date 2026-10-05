---
level: intermediate
age: 12+
prereqs: [03-night-light]
teaches: [ldr, calibration, averaging, counting]
---
## Was du siehst
Eine LED leuchtet über eine Lücke hinweg auf einen Lichtsensor (LDR). Immer wenn etwas durch den Strahl geht, leuchtet die Treffer-LED und ein Zähler steigt — wie die Lichtschranke an einer Ladentür oder an einem Förderband. Der Clou: Das Programm misst beim Start das Licht und legt seine Auslöseschwelle selbst fest. So funktioniert es in einem hellen und in einem dunklen Raum, ohne dass du den Code änderst.

## Probier das
1. Stelle die Helligkeit am LDR hoch und starte das Programm. Lies die Schwelle ab, die es ausgibt.
2. Senke die Helligkeit unter diesen Wert: Die Treffer-LED leuchtet und der Zähler steigt um eins. Hebe sie wieder an und senke sie erneut: Der Zähler steigt noch einmal.
3. Starte mit viel weniger Licht neu. Die ausgegebene Schwelle ändert sich, und die Lichtschranke funktioniert trotzdem.

## Was passiert hier
Der LDR sitzt oben in einem Spannungsteiler, mehr Licht bedeutet also einen höheren Messwert. Beim Start nimmt das Programm acht Messwerte und bildet den Mittelwert, das glättet Störungen. Die Schwelle liegt bei 70 % dieses Mittelwerts: deutlich unter normal, aber nicht so niedrig, dass ein etwas dunklerer Moment sie auslöst.

Eine Variable namens `blocked` merkt sich, ob der Strahl gerade unterbrochen ist. Der Zähler steigt nur beim Wechsel von frei zu unterbrochen, deshalb zählt ein Gegenstand, der im Strahl stehen bleibt, nur einmal.

## Warum das wichtig ist
Echte Sensoren driften mit Temperatur, Alter und Umgebung. Einen Grundwert zu messen und relativ dazu zu arbeiten — statt einer festen Zahl im Code — ist der Weg zu robuster Sensorik, von automatischen Türen bis zu Rauchmeldern.

## Weiter geht's
- [sense-twilight-switch](../sense-twilight-switch) — feste Schwellen mit Hysterese statt Kalibrierung.
- [sense-noise-counter](../sense-noise-counter) — dieselbe Zählidee mit Geräuschen.
- Experiment: Miss, wie lange der Strahl unterbrochen war, und gib es aus — der Anfang einer Geschwindigkeitsmessung.
