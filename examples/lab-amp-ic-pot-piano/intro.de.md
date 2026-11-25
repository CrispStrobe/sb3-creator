# Poti-Klavier mit Leistungsverstärker-Oszillator

Ein LM386 ist als Tonoszillator geschaltet. Der Taster ist die Klaviertaste: Der Ton klingt, solange du ihn hältst. Das Poti stimmt den Ton, ein Schiebeschalter setzt ihn eine Oktave tiefer, der andere ändert, wie weit das Poti stimmen kann.

**Vermittelt:** Kippschwinger, Tonhöhe und RC, Oktave als doppelte Kapazität, Bereichswiderstand

## Was zu tun ist

Klick auf **Sim**. Halte den Taster (KEY) und dreh am Poti TUNE, während er klingt; lass los und drück wieder, um eine Melodie zu spielen. Stell OCTAVE um und spiel noch einmal. Stell RANGE um und dreh das Poti über den ganzen Weg.

## Was du sehen solltest

- Taster oben: Stille. Gehalten: ein Ton, etwa 500 Hz am unteren Ende des Potis, höher, wenn du drehst.
- OCTAVE: alles eine Oktave tiefer (500 → 250 Hz).
- RANGE: Das Poti erreicht viel höhere Töne (bis etwa 9 kHz statt 2,7 kHz).

## Warum es funktioniert

Der Ausgang des Verstärkers ist entweder hoch oder tief. Über die Taste, den Bereichswiderstand und das Poti lädt oder entlädt er den Kondensator an seinem −-Eingang, bis dieser die Schaltschwelle überschreitet, die der +-Eingang vorgibt; dann kippt der Ausgang, und der Kondensator läuft in die andere Richtung. Weniger Widerstand oder weniger Kapazität heißt weniger Zeit pro Schwung, ein höherer Ton. Zwei gleiche Kondensatoren nebeneinander fassen doppelt so viel Ladung: doppelte Zeit, halbe Tonhöhe, eine Oktave tiefer. Bei losgelassener Taste ist der Kondensator abgetrennt, und der Ausgang bleibt einfach, wo er ist.
