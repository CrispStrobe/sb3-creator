---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Förderband mit Richtungswechsel

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Motormodell mit Freigabe an P2.1 und Rückwärtswahl an P2.2 anschließen. P1-Befehle sind 0 Stopp, 1 vorwärts, 2 rückwärts und 3 Stopp mit Programmhalt. Dazwischen 255 einstellen. Beim Richtungswechsel erst deaktivieren und vor der Freigabe 40 Einheiten warten.

In dieser Schaltung zeigen LEDs die Freigabe und die Rückwärtswahl an. Beobachte die Freigabe-LED während des Richtungswechsels.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
