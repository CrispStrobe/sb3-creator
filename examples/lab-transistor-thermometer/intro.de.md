# Transistor-Thermometer 0–100 °C mit Relais-Thermostat

Die Spannung an der Basis-Emitter-Strecke eines Transistors sinkt mit jedem Grad um 2 mV. Ein Operationsverstärker macht aus dieser kleinen Änderung eine Anzeige von 0 bis 100 °C, und ein zweiter schaltet über ein Relais eine Heizung ein, solange es kälter ist als eingestellt.

**Vermittelt:** Temperaturmessung mit einem Halbleiterübergang, Kalibrieren (Nullpunkt und Steigung), Thermostat

## Was zu tun ist

Klick auf **Sim**. Lies das Messgerät ab. Beweg in der Instrumentenspalte den Regler **Temperatur** des Sensors (Eis, Raum, Finger, heiß) und warte jeweils ein paar Sekunden. Mit **SET** wählst du die Thermostat-Temperatur.

## Was du sehen solltest

- Raum (25 °C): Das Messgerät zeigt 25; die Heizlampe ist an, weil SET bei etwa 49 °C steht.
- Heiß (70 °C): Die Anzeige steigt auf 70, und das Relais schaltet die Heizung ab.

## Warum es funktioniert

Bei konstantem Strom braucht ein Silizium-Übergang umso weniger Spannung, je wärmer er ist: 2 mV weniger pro Grad. Der Operationsverstärker zieht diese Spannung von einer festen ab (ZERO, so eingestellt, dass 0 °C 0 V ergibt) und verstärkt den Unterschied 25-fach: 50 mV pro Grad, 5 V bei 100 °C. Der zweite vergleicht das mit SET und hält das Relais angezogen, solange die Anzeige darunter liegt.
