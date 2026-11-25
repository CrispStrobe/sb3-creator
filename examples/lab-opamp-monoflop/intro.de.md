---
level: advanced
age: 14+
prereqs: [lab-opamp-blinker]
teaches: [monostable, astable, comparator, diode-clamp, virtual-ground]
---
## Was du siehst
Ein Operationsverstärker, ein Kondensator, eine rote und eine grüne LED, ein START-Taster und ein Schiebeschalter, der eine Diode hinzufügt.

## Was du tun kannst
1. Klick auf **Sim**. Rot leuchtet einmal, dann bleibt Grün an: Die Schaltung wartet.
2. Drück **START**. Rot leuchtet knapp eine halbe Sekunde, dann wieder Grün, egal wie lange du drückst.
3. Schieb den Schalter nach links (Diode raus). Jetzt blinken Rot und Grün von allein.

## Was passiert hier
Ohne Diode ist das ein Blinker mit Operationsverstärker: Der Kondensator lädt sich bis zu einer Schwelle, der Ausgang kippt, er entlädt sich bis zur anderen Schwelle, der Ausgang kippt zurück. Die Diode hält den Kondensator auf dem Weg nach oben knapp unter der oberen Schwelle fest, also bleibt der Blinker stehen und wartet. Der START-Taster gibt ihm einen Schubs, und er läuft genau einen halben Zyklus: ein Monoflop.

## Weiter geht's
- [lab-opamp-blinker](../lab-opamp-blinker) — der Blinker mit Operationsverstärker allein.
- [lab-two-led-monostable](../lab-two-led-monostable) — ein Monoflop aus Transistoren.
