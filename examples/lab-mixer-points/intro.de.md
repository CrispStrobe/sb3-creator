# Elektronische Weiche: ein Mischer lenkt einen Strom

Ein Mischer-IC hat zwei Eingänge und zwei Ausgänge. Sein Strom fließt zum einen oder zum anderen Ausgang, je nach dem *Produkt* der beiden Eingangssignale: Plus mal Plus und Minus mal Minus schicken ihn in die eine Richtung, Plus mal Minus in die andere. Hier steuert ein blinkender Verstärker den einen Eingang und ein Taster den anderen, und an jedem Ausgang zeigt eine Lampe, wohin der Strom fließt.

**Vermittelt:** doppelt balancierter Mischer, Multiplikation von Vorzeichen, Umschalten

## Was zu tun ist

Klick auf **Sim** und beobachte die rote und die grüne Lampe ein paar Blinkzeichen lang. Halte dann den Taster **STEER** gedrückt und schau wieder hin.

## Was du sehen solltest

- Die beiden Lampen blinken abwechselnd: Leuchtet die eine, ist die andere dunkel.
- Mit gedrücktem Taster blinken sie weiter, aber jede leuchtet jetzt in der anderen Hälfte des Takts.

## Warum es funktioniert

Im Chip teilt ein Transistorpaar seinen Strom nach Eingang A auf; ein über Kreuz verbundenes Vierer-Paket von Transistoren, geschaltet vom anderen Eingang, bestimmt, zu welchem Ausgang jede Hälfte geht. Der Ausgang hängt also von A *mal* B ab. Dreht einer der Eingänge das Vorzeichen um, kippt der Ausgang. Genau dieses Umschalten, eine Million Mal pro Sekunde, mischt zwei Funksignale.
