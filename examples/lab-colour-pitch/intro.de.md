# Die Farbe einer LED hören: Tonhöhe aus der Flussspannung

Ein Tongenerator mit einer LED-Fassung im Ladeweg. Eine rote LED nimmt weniger Spannung weg als eine grüne, eine grüne weniger als eine blaue. Was die LED wegnimmt, fehlt der Spannung, die den Zeitkondensator lädt, und so hat jede Farbe ihre eigene Tonhöhe. Mit etwas Übung erkennst du die Farbe mit geschlossenen Augen.

**Vermittelt:** Flussspannung hängt von der Farbe ab, die Frequenz eines Oszillators hängt von der Ladespannung ab, nicht nur von R und C

## Was zu tun ist

Klick auf **Sim** und hör auf den Piezo: In der Fassung steckt die rote LED. Wähle dann mit dem DIP-Schalter nacheinander die Drahtbrücke, die grüne und die blaue LED. Es sollte immer nur ein Schalter an sein.

## Was du sehen solltest

- Drahtbrücke: höchster Ton, etwa 1,1 kHz.
- Rot: tiefer. Grün: noch tiefer. Blau: am tiefsten, etwa 320 Hz.
- Die LED in der Fassung glimmt schwach, solange der Ton läuft.

## Warum es funktioniert

Der 555 lädt seinen Kondensator von einem Drittel auf zwei Drittel der Versorgungsspannung. Mit einer LED im Weg lädt der Kondensator auf eine niedrigere Spannung hin und erreicht die zwei Drittel langsamer. Je größer der Spannungsabfall der LED, desto langsamer die Ladung und desto tiefer der Ton.
