# FM über den Lichtleiter (100 kHz)

Die LED blinkt etwa 100.000-mal pro Sekunde, und das Potentiometer verändert, wie oft. Am anderen Ende des Lichtleiters machen ein Fototransistor und eine Diodenpumpe aus der Blinkrate wieder eine Spannung. Die Information steckt in der Frequenz, nicht in der Helligkeit.

**Vermittelt:** Frequenzmodulation, warum FM Verluste ignoriert, ein Frequenz-Spannungs-Wandler

## Was zu tun ist

Klick auf **Sim** und beobachte das Messgerät. Dreh am Potentiometer und warte kurz, bis sich die Anzeige beruhigt. Zieh dann mit dem Knopf des Lichtleiters dessen Ende ein paar Millimeter zurück. Die Simulation ist hier langsam: 100 kHz brauchen sehr kleine Zeitschritte.

## Was du sehen solltest

- Potentiometer niedrig: das Messgerät zeigt etwa 1,5 V.
- Potentiometer hoch: etwa 1,25 V.
- Ein kleiner Spalt am Lichtleiterende ändert die Anzeige kaum.

## Warum es funktioniert

Das Potentiometer stellt die Steuerspannung des 555 ein und damit die Blinkfrequenz. Am Empfänger schaltet jeder Lichtblitz den Fototransistor ganz durch, also schiebt jeder Blitz dieselbe kleine Ladung durch den 100-pF-Kondensator und die Dioden. Mehr Blitze pro Sekunde heißt mehr Ladung pro Sekunde und eine höhere mittlere Spannung. Solange jeder Blitz den Fototransistor noch durchschaltet, ändert schwächeres Licht nichts: Darum verwenden Sender und Verbindungen, die Verluste ignorieren sollen, FM.
