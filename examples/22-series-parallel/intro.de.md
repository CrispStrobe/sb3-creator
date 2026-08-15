---
level: beginner
age: 8+
prereqs: [21-resistor-led]
teaches: [series-circuits, parallel-circuits, comparison]
---
## Was du siehst
Zwei Pfade von VCC nach Masse, nebeneinander. Einer hat zwei Widerstände in Reihe; der andere zwei parallel. Die Schaltung zeigt, wie dieselben Widerstände unterschiedliche Gesamtwiderstände ergeben, je nachdem wie sie verbunden sind.

## Probier das
1. Starte die Simulation und vergleiche den Strom in jedem Pfad — der parallele Pfad führt mehr.
2. Schau dir die Spannung über jedem Widerstand im Reihenpfad an — sie teilen sich die Versorgungsspannung.
3. Ändere einen Widerstand im Parallelpfad und beobachte, wie sich der Gesamtstrom stärker ändert als erwartet.

## Was passiert hier
In einer Reihenschaltung fließt der Strom durch einen Widerstand und dann durch den nächsten. Der Gesamtwiderstand ist die Summe: R1 + R2. In einer Parallelschaltung hat der Strom zwei Wege und teilt sich auf. Der Gesamtwiderstand ist kleiner als jeder einzelne: 1/Rgesamt = 1/R1 + 1/R2. Mit zwei gleichen 1k-Widerständen ergibt die Reihenschaltung 2k und die Parallelschaltung 500 Ohm — ein Verhältnis von vier zu eins mit denselben Bauteilen. Die Spannung teilt sich über Reihenwiderstände auf, ist aber über Parallelwiderständen gleich.

## Warum das wichtig ist
Reihe und Parallel sind die zwei Arten, wie Bauteile in jeder Schaltung verbunden werden. Den Unterschied zu verstehen, ermöglicht es dir, Stromfluss vorherzusagen, Verlustleistung zu berechnen und Spannungsteiler zu entwerfen. Diese Regeln gelten nicht nur für Widerstände, sondern auch für Kondensatoren, Spulen und sogar Batterien.

## Weiter geht's
- [21-resistor-led](../21-resistor-led) — der Einzelwiderstand als Ausgangspunkt.
- [23-voltage-regulator](../23-voltage-regulator) — eine weitere reine Schaltung mit komplexerem Verhalten.
- Experiment: Probiere drei Widerstände — zwei parallel, dann diese Kombination in Reihe mit dem dritten — und berechne den Gesamtwiderstand, bevor du ihn in der Simulation überprüfst.
