---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [indirect-addressing, tables]
---
## Tabellenkarte

Importiere ein kompatibles Monitor-ROM mit 2048 Bytes. Starte die CPU, bis der Monitor bereit ist. Halte die CPU an und lade die Zellen. Setze die CPU-Ausführung ohne Reset fort und wähle die Startadresse auf der CP1-Tastatur.

Addiere einen Versatz zur Tabellenadresse und lies das Wort über den berechneten Zeiger.

Lies den Eintrag mit Index 4 aus einer Kalibriertabelle mit sechs Werten. Der erste Eintrag hat Index 0. `038 PC RUN` eingeben. Das Programm addiert den Index zur Tabellenadresse und speichert den Zeiger `00.058` in Zelle 051. Der indirekte Ladebefehl holt `00.123` aus Zelle 058. Am Ende erscheint `P  043`, mit **ACC** dann `A00.123`. Der Ablauf umfasst fünf Lehrbefehle ohne programmierte Wartezeit. Der Grundspeicher genügt. Belegt sind 038–042, 050–051 und 054–059. Externe Anschlüsse sind nicht erforderlich.
