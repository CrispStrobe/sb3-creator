---
level: advanced
age: 14+
prereqs: [lab-heat-alarm, lab-nand-pips]
teaches: [current-mirror, junction-temperature, drift-compensation, schmitt-trigger, alarm]
---
## Was du siehst
Zwei Transistoren nebeneinander, einer heißt Referenz, einer Sensor, dazu ein Logikbaustein, eine rote LED und ein Piezo. Jeder Transistor hat seinen eigenen Temperatur-Schieber.

## Was du tun kannst
1. Klick auf **Sim**. Alles ist still.
2. Schieb den **Temperatur**-Schieber des Sensor-Transistors auf 33 (warme Finger). Nach etwa einer Sekunde leuchtet die LED und der Alarm ertönt.
3. Schieb ihn zurück auf 25. Der Alarm verstummt.
4. Schieb jetzt **beide** Schieber auf 70. Nichts passiert: Der Wächter reagiert nur auf einen Unterschied.

## Was passiert hier
Ein Silizium-Übergang braucht für denselben Strom pro Grad Erwärmung etwa 2 mV weniger Spannung. Der Referenztransistor stellt die Basisspannung für beide ein; der Sensor übernimmt den Strom der Referenz, solange beide gleich warm sind. Erwärmst du nur den Sensor, zieht er mehr Strom, seine Kollektorspannung sinkt, und ein Schmitt-NAND-Gatter schaltet den Alarmton ein. Erwärmst du beide, sinkt die gemeinsame Basisspannung für beide, und nichts ändert sich: Die Drift hebt sich auf.

## Weiter geht's
- [lab-heat-alarm](../lab-heat-alarm) — ein Hitzealarm mit Heißleiter.
- [lab-nand-pips](../lab-nand-pips) — Gatter-Oszillatoren, die ein anderes Signal einschaltet.
