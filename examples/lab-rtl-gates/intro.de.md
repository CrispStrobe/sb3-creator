---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc93-nand-is-universal]
teaches: [transistor-switch, logic-gates, RTL, NAND, NOR, fan-out]
---
## Was du siehst
Logikgatter ganz ohne Chip: sechs Transistoren und ein paar Widerstände. Zwei Taster, A und B, sind die Eingänge. Vier LEDs zeigen NICHT A, A NOR B, A ODER B und A NAND B.

## Probier das
1. Beginne mit beiden Tastern losgelassen: Rot (NICHT), Gelb (NOR) und Blau (NAND) leuchten, Grün (ODER) ist dunkel.
2. Drück A, dann B, dann beide, und schreib für jede LED die Wahrheitstabelle auf.
3. Vergleiche NOR und NAND auf dem Steckbrett. Beide haben zwei Transistoren. Beim NOR stehen sie nebeneinander, beim NAND übereinander. Dieser eine Unterschied entscheidet, welches Gatter entsteht.
4. Schau dir die Ausgangsspannungen an: Ein High-Ausgang hat nur etwa 1,75 V, und das Low des NAND liegt höher als das des NOR.

## Was dahintersteckt
Ein Transistor mit Basisstrom zieht seinen Kollektor fast auf 0 V; ohne Basisstrom zieht der 1-kΩ-Arbeitswiderstand den Kollektor hoch. Ein Transistor ist also ein Inverter. Zwei Transistoren parallel ziehen den Ausgang herunter, sobald einer leitet: NICHT (A ODER B) = NOR. Zwei in Reihe ziehen nur herunter, wenn beide leiten: NICHT (A UND B) = NAND. Der Transistor der grünen LED invertiert den NOR-Ausgang noch einmal und macht daraus ODER. So waren die ersten integrierten Logikfamilien aufgebaut, und deshalb genügen NAND oder NOR allein für alles.

## Weiter geht's
- [pc93-nand-is-universal](../pc93-nand-is-universal): dieselben Gatter aus einem 74HC00.
- [pc05-npn-switch](../pc05-npn-switch): ein Transistor schaltet eine LED.
