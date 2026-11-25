# Gefrierschrank-Wächter mit Fühlerdiode

Ein Gefrierschrank muss unter null bleiben. Eine Diode darin, verglichen mit einer außerhalb, schlägt Alarm, wenn er warm wird.

**Vermittelt:** Diode als Thermometer, Stromspiegel, Übertemperatur-Alarm

## Was zu tun ist

Klick auf **Sim**. Stell in der Instrumentenspalte den Temperaturregler der Fühlerdiode (diode_7) von −10 auf Eis (0), dann auf 10, dann auf Raum (25).

## Was du sehen solltest

- −10 und 0: still.
- Ab 10: der Alarm ertönt.

## Warum es funktioniert

Die Durchlassspannung der Fühlerdiode ist pro Grad Erwärmung etwa 2 mV kleiner. Unter Q2 entscheidet sie, wie viel Strom Q2 von Q1 kopiert: kalt heißt weniger Strom und ein hoher Kollektor, der den Alarm sperrt; warm heißt mehr Strom, der Kollektor fällt und der Alarm wird frei. Mit dem Trimmer stellt man die Temperatur ein, bei der das passiert.
