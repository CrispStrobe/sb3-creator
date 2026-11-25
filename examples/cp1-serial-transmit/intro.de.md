---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Serieller Sender mit Quittung

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Zuerst serial-receive auf der anderen Platine starten. Sender P2.1 mit Empfänger P1.1 (Daten), Sender P2.2 mit Empfänger P1.2 (Low-aktiver Takt) und Empfänger P2.3 mit Sender P1.3 (Low-aktive Quittung) verbinden. Masse gemeinsam führen. Der Sender überträgt Payload mit dem höchstwertigen Bit zuerst und gerader Parität. Er hält jedes Bit bis zur Quittung und wechselt es erst nach deren Freigabe. Bei fehlender Gegenstelle mit STP stoppen.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
