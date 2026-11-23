# Brennt die Lampe wirklich? Stromüberwachung

Das Armaturenbrett eines Autos weiß, wenn ein Rücklicht ausgefallen ist, ohne dass jemand um das Auto läuft. Der Trick ist ein kleiner Widerstand unter der Lampe: Der Strom durch ihn wird zu einer Spannung, und ein Komparator prüft diese Spannung. Lampe eingeschaltet, aber kein Strom, heißt: Birne durchgebrannt oder Leitung unterbrochen, und die Fehler-LED leuchtet.

**Vermittelt:** Strommessung mit einem Shunt, Komparatoren, Fehlererkennung

## Was zu tun ist

Klick auf **Sim**. Die Lampe brennt, die rote Fehler-LED ist dunkel. Stell den Schalter der Lampenfassung auf „entfernt“: Die Fehler-LED leuchtet sofort. Schalte jetzt das Licht aus: Die Fehler-LED geht wieder aus, denn eine fehlende Birne ist nur dann ein Fehler, wenn das Licht brennen soll.

## Was du sehen solltest

- Birne eingesetzt: etwa 0,9 V am Messwiderstand, Fehler-LED aus.
- Birne entfernt: keine Spannung am Messwiderstand, Fehler-LED an.
- Licht aus: Fehler-LED aus, egal was die Birne macht.

## Warum es funktioniert

Die Vergleichsspannung kommt aus derselben geschalteten Versorgung wie die Lampe und verschwindet deshalb, wenn das Licht aus ist. Auch die Fehler-LED hängt an dieser Versorgung. Bremslichter werden genauso überwacht: Das Bremspedal ist dann der Lichtschalter.
