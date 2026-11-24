# Lichtleiter stellt die Tonhöhe ein

Das Ende eines Lichtleiters leuchtet auf einen Fototransistor, der den Zeitkondensator eines 555 mitlädt. Je mehr Licht durchkommt, desto höher der Ton.

**Vermittelt:** Licht verlässt den Lichtleiter als Kegel, Verluste im Lichtleiter als Tonhöhe hören, ein Fototransistor im Zeitglied

## Was zu tun ist

Klick auf **Sim** und hör zu. Dreh den Knopf des Lichtleiters, um sein Ende vom Fototransistor weg und wieder heran zu bewegen. Probiere im Inspektor eine enge Biegung (`bendRadiusCm` 0,5) oder raue Enden (`cutQuality` 0).

## Was du sehen solltest

- 2 mm Abstand: ein Ton um 2 kHz.
- Lichtleiter berührt den Empfänger: viel höher, über 3,5 kHz.
- 10 mm Abstand: herunter auf etwa 725 Hz.

## Warum es funktioniert

Licht verlässt das Ende des Lichtleiters als Kegel; je weiter weg der Empfänger, desto weniger trifft ihn. Der Fototransistor lässt einen Strom durch, der mit dem Licht wächst, und dieser Strom lädt den Kondensator des 555 schneller: Er erreicht seine Schaltschwelle früher, und der Ton steigt.
