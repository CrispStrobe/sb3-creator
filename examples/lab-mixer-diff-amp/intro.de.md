# Der Mischer als HF-Verstärker mit Verstärkungsregelung

Ein Mischer-Chip, dessen Oszillator stillsteht, mischt nicht mehr: Seine Schalter bleiben in einer Stellung, und er verstärkt einfach den Unterschied zwischen seinen beiden Eingängen. Hier liefert ihm ein Dual-Gate-MOSFET den Sender zweimal, vom Drain umgekehrt und von der Source richtig herum, und das zweite Gate des MOSFET ist der Lautstärkeknopf für das Hochfrequenzsignal.

**Vermittelt:** Phasenumkehrstufe, Differenzverstärker, Verstärkungsregelung mit dem Dual-Gate-MOSFET

## Was zu tun ist

Klick auf **Sim** und hör zu. Stell den Schalter **OUTPUT** auf die andere Seite und hör wieder zu. Dreh dann **GAIN** ganz auf 1.

## Was du sehen solltest

- Den Ton des Senders aus dem Lautsprecher; dasselbe vom anderen Ausgang.
- Bei GAIN 1 wird der Sender leiser: Die HF an den Ausgängen des Mischers sinkt etwa auf die Hälfte.

## Warum es funktioniert

Mit gleich großen Widerständen an Drain und Source sinkt der Drain genau so viel, wie die Source steigt: zwei Kopien des Senders in Gegenphase. Der Mischer verstärkt ihren Unterschied, also zählt das Signal doppelt. Gate 2 sitzt über der oberen Hälfte des Kanals: Liegt es um mehr als die Abschnürspannung unter der Source, schnürt es den Kanal zu, und die Verstärkung sinkt — so schützen sich UKW- und Fernsehtuner vor zu starken Sendern.
