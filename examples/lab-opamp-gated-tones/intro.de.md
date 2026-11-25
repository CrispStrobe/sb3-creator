# Getastete Töne: Piepser und Rattern

Zwei Oszillatoren aus Operationsverstärkern, ein langsamer und ein schneller. Der langsame schaltet den schnellen ein und aus: Piepser wie von einem Küken. Mach den langsamen zehnmal schneller, und die Piepser verschmelzen zu einem Rattern.

**Vermittelt:** Tastung, Oszillatoren, Klangeffekte

## Was zu tun ist

Klick auf **Sim** und hör zu. Schieb RATTLE (slide_switch_9) nach rechts und wieder zurück.

## Was du sehen solltest

- Piepser eines Tons von etwa 640 Hz, etwa sieben pro Sekunde; die grüne LED (led_18) leuchtet in den Pausen.
- RATTLE: ein schnelles Rattern, etwa 70 Stöße pro Sekunde.

## Warum es funktioniert

Solange der Ausgang des langsamen Oszillators hoch ist, hält eine Diode den Kondensator des Tonoszillators über seiner oberen Schwelle, und der Ton kann nicht schwingen. Geht der langsame Ausgang auf low, lässt die Diode los, und der Ton beginnt. RATTLE gibt dem langsamen Oszillator einen zehnmal kleineren Kondensator; er schaltet zehnmal so oft.
