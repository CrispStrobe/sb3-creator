# Ein Impuls über einen Transformator setzt ein Flipflop

Ein geladener Kondensator, in eine Wicklung eines Transformators entladen, erzeugt in der anderen Wicklung einen Impuls. Diese Wicklung hat keine Verbindung zur Batterieseite, trotzdem setzt ihr Impuls ein Transistor-Flipflop, das ihn sich merkt. So werden auch Zündanlagen ausgelöst, mit getrennten Seiten.

**Vermittelt:** Impulsübertragung durch einen Transformator, galvanische Trennung, ein Flipflop als Speicher

## Was zu tun ist

Klick auf **Sim**. Grün leuchtet. Drück den linken Taster (er entlädt den Kondensator in die kleine Wicklung) und lass los. Drück dann den rechten Taster (Rücksetzen).

## Was du sehen solltest

- In Ruhe: grün an, rot aus.
- Ein Druck auf den Impuls-Taster: ein Impuls von etwa 5 V in der großen Wicklung, und die LEDs wechseln: rot an. Das bleibt so.
- Rücksetzen: wieder grün. Der Kondensator hat sich inzwischen neu geladen und ist bereit für den nächsten Impuls.

## Warum es funktioniert

Der plötzliche Strom des Kondensators in der kleinen Wicklung baut im Kern ein Magnetfeld auf, und die Änderung dieses Felds induziert in der großen Wicklung eine Spannung. Die Diode lässt den positiven Impuls zur Basis des linken Transistors durch: Er schaltet ein, das schaltet den rechten aus, und der hält den linken über seine 22 kΩ eingeschaltet. Der Rücksetz-Taster legt die linke Basis auf Masse, und das Flipflop kippt zurück.
