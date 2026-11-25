# Feuchteschalter mit dem 555

Hauch den Sensor an, und das Licht wechselt von Grün auf Blau. Zurück wechselt es erst, wenn der Sensor deutlich trockener ist als beim Einschalten – genau das, was eine Luftbefeuchter-Steuerung braucht, damit sie nicht ständig ein- und ausschaltet.

**Vermittelt:** Schmitt-Trigger, Hysterese, Feuchtesensor

## Was zu tun ist

Klick auf **Sim**. Die grüne LED TROCKEN leuchtet. Zieh den Feuchte-Regler des Sensorkamms (humidity_comb_3) auf etwa 90 % (Anhauchen): die blaue LED FEUCHT leuchtet. Zieh ihn dann langsam zurück. Achte darauf, wo er zurückschaltet, und geh danach langsam wieder hoch: wo schaltet er ein?

## Was du sehen solltest

- Raumluft (50 %): grüne LED an.
- Anhauchen (90 %): blaue LED an.
- Bei 74 % bleibt die LED, wie sie war; unter etwa 70 % ist es TROCKEN, über etwa 77 % FEUCHT.

## Warum es funktioniert

Die Salzschicht des Sensors leitet umso besser, je mehr Wasser sie aus der Luft aufnimmt. Dadurch steigt die Spannung am Eingang des 555 mit der Feuchte. Der 555 schaltet seinen Ausgang auf Low, wenn der Eingang 6 V überschreitet, und erst wieder auf High, wenn er unter 3 V gefallen ist. Dazwischen merkt er sich den Zustand.
