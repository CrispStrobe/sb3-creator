---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge]
teaches: [cascaded-filter, attenuation, frequency-response]
---
## Was du siehst
Zwei RC-Tiefpassfilter in Reihe geschaltet. Ein Signal tritt in die erste Stufe ein und kommt aus der zweiten deutlich glaetter und staerker gedaempft heraus als nach nur einer Stufe.

## Probier das
1. Starte die Simulation und beobachte die Spannung am Ausgang jeder Stufe — die zweite Stufe ist glaetter als die erste.
2. Aendere die Eingangsfrequenz und beobachte, wie hoehere Frequenzen steiler gedaempft werden als mit einer einzelnen Stufe.
3. Mache beide Stufen identisch, dann probiere verschiedene Widerstandswerte und vergleiche die Ergebnisse.

## Was passiert hier
Jede RC-Stufe daempft hohe Frequenzen nach derselben Regel: Frequenzen oberhalb der Grenzfrequenz werden um 20 dB pro Dekade reduziert. Zwei kaskadierte Stufen verdoppeln das auf 40 dB pro Dekade und erzeugen eine viel steilere Flanke. Allerdings belastet die zweite Stufe auch die erste, sodass die kombinierte Grenzfrequenz niedriger liegt als bei jeder Stufe einzeln. Der Gesamteffekt ist ein Filter, das tiefe Frequenzen sauber durchlaesst und hohe Frequenzen aggressiver unterdrueckt.

## Warum das wichtig ist
Einstufige RC-Filter sind sanft — sie lassen viel Rauschen in der Naehe der Grenzfrequenz durch. Kaskadierte Stufen ergeben ein steileres Filter ohne Spulen oder Operationsverstaerker, was nuetzlich ist, wenn man bessere Rauschunterdrueckung nur mit passiven Bauteilen braucht.

## Weiter geht's
- [pc06-rc-charge](../pc06-rc-charge) — der einstufige RC-Filter, auf dem dies aufbaut.
- [pc52-inductor-filter](../pc52-inductor-filter) — eine andere Art passiver Filter mit einer Spule.
- Experiment: Fuege eine dritte RC-Stufe hinzu und miss, ob die Flanke wie theoretisch vorhergesagt auf 60 dB pro Dekade ansteigt.
