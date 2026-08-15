---
level: intermediate
age: 12+
prereqs: [pc45-nand-test]
teaches: [nor-latch, memory-element, set-reset]
---
## Was du siehst
Zwei NOR-Gatter kreuzgekoppelt als SR-Latch. Die Schaltung merkt sich, welcher Taster zuletzt gedrueckt wurde — Set oder Reset — und haelt diesen Zustand auch nach dem Loslassen.

## Probier das
1. Druecke kurz den Set-Taster und beobachte, wie die Ausgangs-LED angeht und an bleibt.
2. Druecke kurz den Reset-Taster und beobachte, wie die Ausgangs-LED ausgeht und aus bleibt.
3. Druecke keinen Taster — der Ausgang haelt seinen letzten Zustand. Das ist Speicher.

## Was passiert hier
Der Ausgang jedes NOR-Gatters fuehrt in den Eingang des anderen Gatters und erzeugt eine Rueckkopplungsschleife. Wenn du Set pulsierst, zwingt es den Ausgang eines Gatters auf low, was den Ausgang des anderen Gatters auf high bringt — und dieses high fuettert zurueck und haelt den ersten Ausgang low, auch nachdem Set losgelassen wird. Die Schaltung hat zwei stabile Zustaende und bleibt in dem, in den sie zuletzt gedrueckt wurde. Das ist die einfachste Form digitalen Speichers: ein Bit, gespeichert in zwei Gattern.

## Warum das wichtig ist
Jedes Register, jedes Byte SRAM und jedes Flip-Flop in einem Computer besteht aus kreuzgekoppelten Gattern. Das SR-Latch ist der Anfang digitalen Speichers. Es zu verstehen macht Flip-Flops, Zaehler und schliesslich ganze CPUs weniger mysterioeus — sie sind alle aus diesem Muster aufgebaut, nur hochskaliert.

## Weiter geht's
- [pc45-nand-test](../pc45-nand-test) — das individuelle Gatterverhalten, das Latches ermoeglicht.
- [pc57-inverter-lamp](../pc57-inverter-lamp) — ein einzelnes Gatter ohne Speicher zum Vergleich.
- Experiment: Druecke Set und Reset gleichzeitig und beobachte den verbotenen Zustand — beide Ausgaenge gehen auf low, und das Ergebnis beim Loslassen ist unvorhersagbar. Deshalb vermeiden echte Schaltungen das.
