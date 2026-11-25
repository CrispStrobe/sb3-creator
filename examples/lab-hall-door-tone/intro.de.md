# Magnet an der Tür: Ein Hall-Schalter startet einen Ton

Ein Hall-Schalter bemerkt einen Magneten, ohne ihn zu berühren. Hier schaltet er einen Transistor, der den Tonoszillator eines Verstärkerchips freigibt: ein Türalarm, der ertönt, wenn der Magnet an der Tür näher kommt.

**Vermittelt:** Hall-Schalter, ein Transistor als Freigabeschalter, ein LM386-Tonoszillator

## Was zu tun ist

Klick auf **Sim**. Stell das Feld des Hall-Sensors auf 0,8, dann wieder auf 0.

## Was du sehen solltest

- Kein Magnet: Die LED ist dunkel, der Lautsprecher still.
- Magnet: Die LED leuchtet, und ein Ton von etwa 500 Hz ertönt.
- Magnet weg: wieder still.

## Warum es funktioniert

Ohne Magnet ist der Ausgang des Hall-Schalters hoch, also leitet der Transistor und hält den Kondensator des Oszillators auf Masse. Ein genügend starkes Feld zieht den Ausgang nach unten: Der Transistor lässt los, und der LM386 lädt und entlädt seinen Kondensator über seine eigene Rückkopplung, das ergibt den Ton. Derselbe Ausgang lässt die LED leuchten. Alarmkontakte an Fenstern und der Deckelsensor eines Laptops arbeiten so.
