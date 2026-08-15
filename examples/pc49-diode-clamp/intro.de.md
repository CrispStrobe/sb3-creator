---
level: beginner
age: 12+
prereqs: [pc08-diode-polarity]
teaches: [diode-clamp, voltage-limiting, signal-protection]
---
## Was du siehst
Eine Signalquelle treibt eine Spannung durch ein Paar Dioden, die sie zwischen Masse und Versorgungsspannung begrenzen. Wenn der Eingang diese Grenzen ueberschreitet, leiten die Dioden und halten den Ausgang stabil.

## Probier das
1. Starte die Simulation und beobachte die Ausgangsspannung am Messpunkt — sie bleibt im begrenzten Bereich, auch wenn der Eingang weit ausschlaegt.
2. Entferne eine der Klemmdioden und beobachte, wie der Ausgang nur noch auf einer Seite begrenzt wird.
3. Aendere die Eingangsamplitude und pruefe, dass sich die Klemmspannung nicht aendert.

## Was passiert hier
Jede Diode leitet, wenn die Spannung ueber ihr etwa 0,7 V in Durchlassrichtung ueberschreitet. Eine Diode ist mit Masse verbunden und faengt negative Ausschlaege ab; die andere ist mit der Versorgung verbunden und faengt positive Ausschlaege ab. Zwischen diesen beiden Schwellen sind die Dioden gesperrt und das Signal passiert unveraendert. So entsteht ein sicheres Spannungsfenster fuer die nachfolgende Schaltung.

## Warum das wichtig ist
Klemmschaltungen schuetzen empfindliche Eingaenge — Mikrocontroller-Pins, Operationsverstaerker-Eingaenge, Messschaltungen — vor schaedlichen Spannungen. Es ist eine der einfachsten und haeufigsten Schutztechniken in der Elektronik.

## Weiter geht's
- [pc08-diode-polarity](../pc08-diode-polarity) — verstehe, wie eine Diode nur in einer Richtung leitet.
- [pc61-diode-or](../pc61-diode-or) — Dioden fuer Logik statt Schutz.
- Experiment: Fuege einen Vorwiderstand vor der Klemmschaltung ein und miss, wie er den Strom durch die Dioden begrenzt, wenn sie leiten.
