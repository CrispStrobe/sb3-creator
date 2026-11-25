# Verstärker-Chip als Blinker

Ein NF-Leistungsverstärker muss nicht Musik verstärken. Mit Rückkopplung auf beide Eingänge wird er zum Blinker, der seinen Ausgang von selbst zwischen fast 0 V und fast 9 V hin- und herschaltet.

**Vermittelt:** Kippschwinger, Mitkopplung, Wechselblinker

## Was zu tun ist

Klick auf **Sim** und beobachte die rote und die grüne LED. Schließ dann den **Schalter**, um den Lautsprecher anzuschließen, und hör hin.

## Was du sehen solltest

- Rot und Grün wechseln sich ab, etwa sechsmal pro Sekunde.
- Mit geschlossenem Schalter klickt der Lautsprecher bei jedem Wechsel.

## Warum es funktioniert

Der +-Eingang bekommt eine Schwelle, die vom Ausgang abhängt: Ausgang hoch, Schwelle hoch; Ausgang tief, Schwelle tief. Der Kondensator am −-Eingang läuft dem Ausgang langsam hinterher. Erreicht er die Schwelle, kippt der Verstärker, die Schwelle springt auf die andere Seite, und der Kondensator muss zurück. Der Kondensator zum Lautsprecher lässt nur die Sprünge durch: Klicks.
