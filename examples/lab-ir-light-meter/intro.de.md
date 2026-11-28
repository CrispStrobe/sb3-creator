---
level: advanced
age: 14+
prereqs: [lab-led-sensor-colours, lab-led-light-sensor]
teaches: [offset, zero-adjust, difference-amplifier, inverse-square-law]
---
## Was du siehst
Eine Infrarot-LED leuchtet auf eine zweite IR-LED, die als Lichtsensor arbeitet. Zwei Operationsverstärker machen aus ihrem winzigen Fotostrom einen Zeigerausschlag. Mit dem Poti "Null" stellst du den Nullpunkt des Messgeräts ein.

## Probier das
1. Klick auf **Sim**. Das Messgerät zeigt etwa 1,2 V.
2. Schalte die IR-Lampe aus. Im Dunkeln zeigt es immer noch etwa 0,1 V: Das ist der Offset.
3. Dreh das Null-Poti langsam höher, bis der Zeiger gerade auf 0 steht.
4. Schalte die Lampe wieder ein und verstell den Abstand am Lichtweg: 5 cm, 10 cm, 20 cm. Bei doppeltem Abstand bleibt nur etwa ein Viertel übrig.

## Was passiert hier
Der erste Operationsverstärker wandelt den Fotostrom in eine Spannung um. An nur einer Batterie kann er nicht bis hinunter auf 0 V arbeiten. Darum hebt ein Spannungsteiler seinen Eingang auf etwa 1 V, und auch im Dunkeln liegt sein Ausgang auf diesem 1 V. Der zweite Operationsverstärker ist ein Differenzverstärker: Er gibt die Spannung der ersten Stufe minus die Spannung am Null-Poti aus. Stimmt das Poti genau mit dem 1 V überein, zeigt Dunkelheit null an, und der Zeiger zeigt nur noch das Licht. Jedes genaue Messgerät hat so einen Nullpunktabgleich.

## Weiter geht's
- [lab-led-sensor-colours](../lab-led-sensor-colours) — welches Licht ein LED-Sensor sehen kann.
- [lab-optical-bench](../lab-optical-bench) — das Abstandsgesetz mit einer Fotodiode.
