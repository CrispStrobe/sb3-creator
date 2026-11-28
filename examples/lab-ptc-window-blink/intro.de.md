# Temperaturfenster: innen grün, außen eine blinkende Warnung

Die Spannung eines Temperaturfühlers wird von einem Operationsverstärker verstärkt und von zwei weiteren mit einer unteren und einer oberen Grenze verglichen. Zwei Schmitt-NAND-Gatter verknüpfen die Antworten: Im Fenster zeigt eine grüne LED „alles in Ordnung“; außerhalb, zu kalt oder zu warm, lässt ein Verstärkerchip eine rote Warn-LED blinken.

**Vermittelt:** Fensterkomparatoren, zwei Bedingungen mit NAND-Gattern verknüpfen, ein Gatter gibt einen Oszillator frei

## Was zu tun ist

Klick auf **Sim**. Stell die Umgebung des PTC auf 25 °C, dann auf 15 °C und 35 °C.

## Was du sehen solltest

- 25 °C: Die grüne LED leuchtet, die rote ist dunkel.
- 15 °C oder 35 °C: Die grüne LED geht aus, und die rote blinkt mehrmals pro Sekunde.

## Warum es funktioniert

Der Widerstand des PTC steigt mit der Temperatur, also auch die Spannung an ihm; Operationsverstärker 1 verdreifacht sie. Operationsverstärker 2 meldet „über der unteren Grenze“, Operationsverstärker 3 „unter der oberen Grenze“; nur im Fenster sind beide hoch. Dann geht NAND-Gatter 1 auf tief, Gatter 2 kehrt das um: Die grüne LED leuchtet, und ein Transistor hält den Kondensator des Blinkers auf 0 V, sodass er nicht schwingen kann. Außerhalb des Fensters lässt der Transistor los, der LM386 lädt und entlädt seinen Kondensator, und sein Ausgang schaltet einen PNP-Transistor, der die rote LED treibt.
