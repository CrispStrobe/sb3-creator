---
level: beginner
age: 12+
prereqs: [pc45-nand-test]
teaches: [inverter, logic-not, lamp-driver]
---
## Was du siehst
Ein logischer Inverter (NOT-Gatter), der eine Lampe ansteuert. Wenn der Eingang high ist, ist die Lampe aus; wenn der Eingang low ist, geht die Lampe an. Der Ausgang ist immer das Gegenteil des Eingangs.

## Probier das
1. Setze den Eingang auf high und pruefe, dass die Lampe aus ist.
2. Setze den Eingang auf low und beobachte, wie die Lampe angeht.
3. Schalte den Eingang schnell um und beobachte, wie die Lampe invers folgt.

## Was passiert hier
Ein NOT-Gatter gibt das logische Komplement seines Eingangs aus: high wird low, low wird high. Die Lampe ist am Ausgang angeschlossen und leuchtet, wenn der Ausgang high ist (Eingang low). Das ist die einfachste moegliche Logikfunktion — ein Eingang, ein Ausgang, immer entgegengesetzt. In dieser Schaltung dient das Gatter auch als Treiber und liefert genug Strom fuer die Lampe, den ein schwaches Signal allein nicht aufbringen koennte.

## Warum das wichtig ist
Invertierung ist der grundlegende Baustein digitaler Logik. Jedes Flip-Flop, jeder Zaehler und jeder Prozessor besteht aus Gattern, und der Inverter ist das einfachste. Ein Gatter als Lampentreiber zu nutzen zeigt auch, dass Logikausgaenge echte Arbeit leisten koennen, nicht nur mit anderer Logik kommunizieren.

## Weiter geht's
- [pc45-nand-test](../pc45-nand-test) — ein NAND-Gatter, das Invertierung in einem Zwei-Eingangs-Gatter enthaelt.
- [pc59-nor-memory](../pc59-nor-memory) — NOR-Gatter, die Invertierung mit Speicher kombinieren.
- Experiment: Schalte zwei Inverter in Reihe und pruefe, dass der Ausgang dem Eingang entspricht — doppelte Invertierung hebt sich auf.
