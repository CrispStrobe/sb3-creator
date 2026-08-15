---
level: intermediate
age: 12+
prereqs: []
teaches: [breadboard-layout, strip-connectivity, debugging]
---
## Was du siehst
Eine einfache LED-Schaltung, Schritt fuer Schritt auf einem Steckbrett aufgebaut. Die Bauteile sind so platziert, dass die internen Verbindungen sichtbar werden: die langen Stromschienen laufen horizontal, die kurzen Bauteilstreifen vertikal, und der Mittelkanal unterbricht die Verbindung. Das Layout richtig zu haben ist der Unterschied zwischen einer funktionierenden Schaltung und einer frustrierenden Fehlersuche.

## Probier das
1. Starte die Simulation und bestaetie, dass die LED leuchtet, wenn die Bauteile korrekt platziert sind.
2. Verschiebe die LED in die falsche Reihe, sodass sie nicht mehr mit dem Widerstand verbunden ist — beobachte, wie sie dunkel bleibt.
3. Ueberbruecke den Mittelkanal mit einem Kabel und pruefe, ob die Verbindung wiederhergestellt ist.

## Was passiert hier
Ein steckerloses Steckbrett hat zwei Arten interner Verbindungen: Stromschienen (lange horizontale Streifen, meist rot und blau markiert) und Bauteilstreifen (kurze vertikale Gruppen von fuenf Loechern). Bauteile im selben Streifen sind elektrisch verbunden. Der Mittelkanal teilt das Board in zwei Haelften ohne Verbindung — das ist Absicht, damit DIP-ICs ihn ueberbruecken koennen, wobei jeder Pin seinen eigenen Streifen hat. Die meisten Verdrahtungsfehler kommen daher, dass man nicht versteht, welche Loecher verbunden sind.

## Warum das wichtig ist
Das Steckbrett ist das Standard-Prototyping-Werkzeug fuer Elektronik. Jede Schaltung in dieser Galerie kann darauf aufgebaut werden. Das interne Layout zu verstehen beseitigt die haeufigste Ursache fuer Verdrahtungsfehler bei Anfaengern.

## Weiter geht's
- [21-resistor-led](../21-resistor-led) — die Schaltung, auf der diese Layoutuebung basiert.
- [22-series-parallel](../22-series-parallel) — ein komplexeres Layout mit Reihen- und Parallelpfaden auf dem Steckbrett.
- Experiment: Baue eine Schaltung mit zwei LEDs auf gegenueberliegenden Seiten des Mittelkanals, die sich eine gemeinsame Masseschiene teilen, und pruefe, ob beide leuchten.
