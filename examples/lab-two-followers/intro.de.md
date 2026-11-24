---
level: intermediate
age: 14+
prereqs: [lab-ce-vs-follower]
teaches: [emitter-follower, current-gain, darlington, loading]
---
## Was du siehst
Ein Drehknopf, zwei Transistoren hintereinander, eine rote LED mit einem Schalter, der bestimmt, welcher Transistor sie versorgt, drei Spannungsmesser und ein Strommesser in der ersten Basisleitung. Der Knopf hängt nicht direkt an der Basis: Dazwischen sitzt ein großer Widerstand von 47 kΩ, wie bei einem schwachen Sensor.

## Probier das
1. Klick auf **Sim** und lies die drei Spannungsmesser ab. Um wie viel liegt jeder unter dem vorigen?
2. Lies den Strommesser ab: Wie wenig Basisstrom reicht, damit die LED leuchtet?
3. Leg den Schalter um, sodass die LED am ersten Transistor hängt. Achte auf den Strommesser, den ersten Spannungsmesser und die LED.
4. Schalte zurück und dreh den Knopf langsam herunter. Bei welcher Knopfspannung geht die LED aus?

## Was passiert hier
Ein Emitterfolger gibt seine Basisspannung an den Emitter weiter, nur um die etwa 0,7 V der Basis-Emitter-Strecke kleiner. Die Spannung wird also nicht größer, wohl aber der Strom: Aus dem Emitter kommt rund hundertmal so viel, wie in die Basis fließt. Hängt ein zweiter Folger hinter dem ersten, multiplizieren sich die Verstärkungen, und die Milliampere der LED brauchen an der ersten Basis nur ein paar Mikroampere. So ein winziger Strom lässt am 47-kΩ-Widerstand kaum Spannung abfallen. Mit nur einem Folger muss die Basis viel mehr liefern, der Widerstand schluckt einen großen Teil der Spannung, und die LED leuchtet schwächer – obwohl ein einzelner Folger weniger Spannung verliert. Zwei so zusammengeschaltete Folger heißen Darlington-Schaltung.

## Weiter geht's
- [lab-ce-vs-follower](../lab-ce-vs-follower) — ein Folger neben einer verstärkenden Stufe.
- [lab-inverting-stages](../lab-inverting-stages) — zwei verstärkende Stufen hintereinander.
