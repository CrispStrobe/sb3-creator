---
level: foundation
age: 11+
prereqs: [cp1-first-display]
teaches: [arithmetic, loops]
---
## Absteigende Summe

Importiere ein kompatibles Monitor-ROM mit 2048 Bytes. Starte die CPU, bis der Monitor bereit ist. Halte die CPU an und lade die Zellen. Setze die CPU-Ausführung ohne Reset fort und wähle die Startadresse auf der CP1-Tastatur.

Addiere den aktuellen Wert zur Summe und verringere ihn nach jedem Durchlauf.

Addiere die ganzen Zahlen von 7 abwärts bis 1. Programm laden, `010 PC RUN` eingeben und auf `P  025` warten. **ACC** zeigt `A00.028`. In Zelle 030 steht `00.000`, in Zelle 031 steht `00.028`. Der Vergleich mit null beendet die Schleife vor einer weiteren Subtraktion. Der Ablauf umfasst 72 Lehrbefehle ohne programmierte Wartezeit. Der Grundspeicher genügt. Belegt sind 010–024 und 030–033. Externe Anschlüsse sind nicht erforderlich.
