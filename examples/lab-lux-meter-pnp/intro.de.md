# Luxmeter: eine PNP-Stufe und ein Operationsverstärker-Folger nebeneinander

Zwei Lichtmesser, auf zwei Arten gebaut. Beim einen bringt ein PNP-Transistor das Signal des Fototransistors zum Messgerät, beim anderen ein Operationsverstärker als Folger. Gib beiden dasselbe Licht und vergleiche.

**Vermittelt:** der Fototransistor als Stromquelle, die PNP-Transistorstufe, der Spannungsfolger, Versatz und Proportionalität

## Was zu tun ist

Klick auf **Sim**. Stell die Lichtregler beider Fototransistoren auf denselben Wert: 0, 0,02, 0,05, 0,1, 0,2. Vergleiche jedes Mal die beiden Messgeräte.

## Was du sehen solltest

- Beide Anzeigen wachsen um etwa 2,4 V pro 0,1 Licht.
- Bei sehr wenig Licht (0,02) bewegt sich nur der Folger (0,47 V), das PNP-Messgerät bleibt auf null.
- Bei 0,1 Licht: PNP etwa 1,7 V, Folger etwa 2,35 V.

## Warum es funktioniert

Ein Fototransistor lässt einen Strom durch, der dem Licht proportional ist. An 4,7 kΩ wird daraus eine proportionale Spannung, die der Operationsverstärker unverändert ans Messgerät weitergibt. Der PNP-Transistor arbeitet von oben: Sobald die Spannung an seinem Basiswiderstand etwa 0,65 V übersteigt, liegt der Rest an seinem Emitterwiderstand, und der Kollektor gibt denselben Strom ans Messgerät. Das PNP-Messgerät hat dieselbe Steigung, beginnt aber später.
