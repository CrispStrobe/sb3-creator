# Frequenzverdoppler aus vier Operationsverstärkern

Ein Operationsverstärker lässt eine grüne LED blinken. Drei weitere beobachten, wie die Rampe an seinem Kondensator durch ein Fenster läuft — zweimal pro Blinken — und lassen eine rote LED doppelt so schnell blinken.

**Vermittelt:** Fensterkomparator, NAND aus Komparatoren, Frequenzverdopplung

## Was zu tun ist

Klick auf **Sim** und vergleich die grüne LED (led_17) mit der roten (led_19). Dann dreh WIDTH (potentiometer_10) langsam auf.

## Was du sehen solltest

- Rot blinkt zweimal bei jedem grünen Blinken.
- Mit aufgedrehtem WIDTH schließt sich das Fenster, und die rote LED bleibt an.

## Warum es funktioniert

Die Rampe steigt durch das Fenster und fällt eine halbe Periode später wieder hindurch. Zwei Komparatoren melden „über dem unteren Rand“ und „unter dem oberen Rand“; nur wenn beides stimmt, ist die Rampe im Fenster, und der vierte Operationsverstärker zieht die Leitung der roten LED nach unten. Zwei Durchgänge pro Periode ergeben die doppelte Frequenz.
