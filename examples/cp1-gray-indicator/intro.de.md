---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [gray-code, timed-output]
---
## Gray-Anzeige

Importiere ein kompatibles Monitor-ROM mit 2048 Bytes. Starte die CPU, bis der Monitor bereit ist. Halte die CPU an und lade die Zellen. Setze die CPU-Ausführung ohne Reset fort und wähle die Startadresse auf der CP1-Tastatur.

Die drei LEDs zeigen P2.0–P2.2. Beobachte die Portwerte oder erhöhe den Warteoperanden für eine langsamere Folge.

P2-Anschlüsse 1–3 mit einem Logikanalysator oder drei geeigneten Anzeigen beobachten. `008 PC RUN` eingeben. Ab dem ersten Schreibvorgang nach RUN erscheinen an P2 die Hexwerte `F8 F9 FB FA FE FF FD FC`. Zwischen zwei aufeinanderfolgenden Werten wechselt jeweils genau ein Anschluss den Pegel. Die Anschlüsse 4–8 bleiben während der Folge High. Jeder Zustand dauert ungefähr 84 ms. Zwischen zwei Wechseln sind 70–105 ms zulässig. Innerhalb einer Sekunde nach dem ersten Schreibvorgang erscheint `P  020`, und P2 bleibt auf `0xFC`. Der Ablauf umfasst 72 Lehrbefehle, darunter acht Wartezeiten zu je 75 Einheiten. Der Grundspeicher genügt. Belegt sind 008–019, 030–032 und 044–051.
