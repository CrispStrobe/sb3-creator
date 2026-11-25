---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Rätsel mit zwei Weichen

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Weichen an P1.1 und P1.2 einstellen. P2.1 und P2.2 spiegeln die beiden gewählten Abzweige. P2.3 wird nur bei rechtem geschlossenem und linkem offenem Logikzweig High, also P1.2 High und P1.1 Low. Alle vier Einstellungen vorhersagen und prüfen.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
