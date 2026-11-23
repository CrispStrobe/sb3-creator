---
level: advanced
age: 14+
prereqs: [pc08-diode-polarity, lab-opamp-gain]
teaches: [precision-rectifier, diode-threshold, negative-feedback, op-amp, AC-measurement]
---
## Was du siehst
Zwei Gleichrichter am selben Drehknopf. Der eine ist eine einfache Diode mit Lastwiderstand. Der andere ist dieselbe Diode, aber in der Rückkopplungsschleife eines Operationsverstärkers. Der Knopf verstellt nur etwa ein Volt in jede Richtung, ein typisch kleines Signal, wie es ein Aussteuerungsmesser messen muss.

## Probier das
1. Am Anfang (Eingang +0,51 V) lässt die einfache Diode gar nichts durch, der Präzisionsgleichrichter dagegen die vollen 0,51 V.
2. Dreh INPUT langsam bis zum Anschlag. Die einfache Diode lässt unter etwa 0,2 V fast nichts durch und bleibt immer etwa 0,4 V zurück (0,15 V am Start, 0,60 V am Anschlag).
3. Dreh INPUT unter die Mitte. Beide Ausgänge sperren die negative Hälfte. Schau, was der Ausgang des Operationsverstärkers dann macht.
4. Beobachte auf der positiven Seite den Ausgang des Operationsverstärkers selbst: Er liegt immer eine Diodenspannung über dem Eingang.

## Was dahintersteckt
Eine Siliziumdiode leitet erst richtig, wenn einige Zehntel Volt an ihr liegen, bei einigen Milliampere etwa 0,7 V. Beim Gleichrichten der Netzspannung stört dieser Verlust kaum; bei einem 0,5-V-Audiosignal verschluckt er das meiste. Im Präzisionsgleichrichter vergleicht der Operationsverstärker seinen Eingang mit dem Ausgang hinter der Diode und hebt seinen eigenen Ausgang an, bis beide gleich sind. Der Spannungsabfall der Diode (hier etwa 0,42 V) ist noch da, aber der Operationsverstärker gleicht ihn stillschweigend aus. Das ist der allgemeine Trick der Gegenkopplung: Was an Unvollkommenheit in der Schleife sitzt, korrigiert die Schleife. Wechselspannungsmesser und VU-Meter messen so kleine Signale ehrlich.

## Weiter geht's
- [lab-opamp-gain](../lab-opamp-gain): Rückkopplung bestimmt die Verstärkung.
- [pc49-diode-clamp](../pc49-diode-clamp): was eine einfache Diode mit einem Signal macht.
