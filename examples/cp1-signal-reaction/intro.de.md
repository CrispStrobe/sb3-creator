---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Reaktionssignal

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

P1.3 auf Masse wählt die kurze Wartezeit, offen die lange. P1.4 offen lassen, bis P2.6 High wird, und dann den Antworttaster drücken. Der Zähler erfasst volle Intervalle von 35 Einheiten nach dem Signal, höchstens zwölf.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
