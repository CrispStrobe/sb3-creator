# Die Drehzahl eines Motors messen und halten

Ein Magnet oder ein Schlitz auf der Welle liefert bei jeder Umdrehung einen Impuls. Macht man aus jedem Impuls einen Impuls fester Länge und mittelt sie, erhält man eine Spannung, die mit der Drehzahl wächst. Vergleicht man diese Spannung mit der gewünschten Drehzahl und lässt die Differenz den Motor antreiben, hält die Drehzahl auch dann, wenn der Motor schwerer arbeiten muss.

**Vermittelt:** Frequenz-Spannungs-Wandlung, Gegenkopplung, Soll- und Istwert

## Was zu tun ist

Klick auf **Sim** und beobachte das Messinstrument und die Motordrehzahl. Gib dem Motor dann ein Lastmoment. Stell den Schiebeschalter auf Handbetrieb, dreh den Gasregler, bis der Motor ähnlich schnell läuft, und gib wieder dieselbe Last.

## Was du sehen solltest

- Geregelt steht das Instrument bei etwa halbem Ausschlag, und die Drehzahl ändert sich unter Last kaum.
- Im Handbetrieb bremst dieselbe Last den Motor stark ab, und er bleibt langsam.

## Warum es funktioniert

Der 555 macht aus jedem Geberimpuls einen Impuls gleicher Länge. Je mehr Impulse pro Sekunde, desto höher die mittlere Spannung. Der Operationsverstärker summiert ständig die Differenz zwischen dieser Spannung und dem Sollwert auf. Solange der Motor zu langsam ist, steigt der Antrieb weiter; er hört erst auf zu steigen, wenn die gemessene Drehzahl dem Sollwert entspricht. Davor kann sich keine Last verstecken, deshalb arbeiten Tempomaten und Lüfterregler genau so.
