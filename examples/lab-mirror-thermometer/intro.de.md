---
level: advanced
age: 14+
prereqs: [lab-heat-alarm, lab-thermocouple]
teaches: [current-mirror, junction-temperature, inverting-amplifier, thermometer]
---
## Was du siehst
Zwei Transistoren als Stromspiegel, einen Operationsverstärker und ein Messgerät. Ein Transistor ist der Sensor und hat seinen eigenen Temperatur-Schieber.

## Was du tun kannst
1. Klick auf **Sim**. Der Zeiger steht auf null.
2. Schieb den **Temperatur**-Schieber des Sensors auf 70 (heißes Wasser). Der Zeiger steigt, erst schnell, dann langsamer, bis etwa 4,2 V.
3. Schieb ihn auf 0 (Eis). Der Zeiger will unter null.
4. Steht der Zeiger bei Raumtemperatur nicht auf null, dreh am **ZERO**-Poti.

## Was passiert hier
Der Referenztransistor stellt eine Basisspannung ein; der Sensor übernimmt seinen Strom, solange beide gleich warm sind. Ein wärmerer Sensor-Übergang braucht pro Grad etwa 2 mV weniger, also führt er etwas mehr Strom und seine Kollektorspannung sinkt. Der Operationsverstärker verstärkt diesen Abfall etwa siebenfach und dreht ihn richtig herum, und das Messgerät zeigt etwa 0,09 V für jedes Grad über Raumtemperatur.

## Weiter geht's
- [lab-heat-watchdog](../lab-heat-watchdog) — derselbe Spiegel als Alarm.
- [lab-thermocouple](../lab-thermocouple) — eine andere Art Thermometer.
