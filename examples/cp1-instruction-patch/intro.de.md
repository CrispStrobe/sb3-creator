---
level: advanced
age: 11+
prereqs: [cp1-first-display]
teaches: [two-byte-words, self-modifying-code]
---
## Befehlswechsel

Importiere ein kompatibles Monitor-ROM mit 2048 Bytes. Starte die CPU, bis der Monitor bereit ist. Halte die CPU an und lade die Zellen. Setze die CPU-Ausführung ohne Reset fort und wähle die Startadresse auf der CP1-Tastatur.

Kopiere ein vollständiges Lehrwort in eine spätere Befehlszelle und führe den geänderten Befehl aus.

Zu Beginn steht `04.014` in Zelle 069. Mit `066 PC RUN` kopiert das Programm das vollständige Befehlswort `04.197` aus Zelle 078 nach Zelle 069 und springt dorthin. Am Ende erscheint `P  071`, mit **ACC** dann `A00.197`. Nach `069 OUT` erscheint `C04.197`. Erneutes Laden stellt das ursprüngliche Wort wieder her. Der Ablauf umfasst fünf Lehrbefehle ohne programmierte Wartezeit. Der Grundspeicher genügt. Belegt sind 066–070 und 078. Externe Anschlüsse sind nicht erforderlich.
