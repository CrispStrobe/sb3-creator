# Flipflops aus Operationsverstärkern: setzen, löschen, umschalten

Zwei Speicher aus Operationsverstärkern. Der erste hat einen Taster SET und einen Taster RESET. Der zweite hat nur einen Taster, und jeder Druck schaltet ihn in den anderen Zustand.

**Vermittelt:** Speicher (Latch), Mitkopplung, Toggle-Flipflop

## Was zu tun ist

Klick auf **Sim**. Drück SET (button_9), dann RESET (button_11), und beobachte die gelbe LED (led_14). Dann drück TOGGLE (button_18) ein paar Mal, mit etwa einer Sekunde Pause, und beobachte die rote LED (led_22).

## Was du sehen solltest

- SET: Gelb an; RESET: Gelb aus. Es bleibt, wie du es verlassen hast.
- TOGGLE: Rot an, aus, an, aus, ein Wechsel pro Druck, auch wenn du den Taster festhältst.

## Warum es funktioniert

Jeder Operationsverstärker führt einen Teil seines Ausgangs auf seinen +-Eingang zurück; wie er auch geschaltet ist, er hält sich selbst dort. Der Kondensator des Umschalters lädt sich langsam vom Ausgang und hält beim Drücken noch den alten Zustand; der Taster legt diesen alten Pegel an den anderen Eingang und schiebt den Verstärker in die Gegenrichtung.
