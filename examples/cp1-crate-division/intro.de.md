---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [arithmetic, conditional-branch]
---
## Kistenaufteilung

Importiere ein kompatibles Monitor-ROM mit 2048 Bytes. Starte die CPU, bis der Monitor bereit ist. Halte die CPU an und lade die Zellen. Setze die CPU-Ausführung ohne Reset fort und wähle die Startadresse auf der CP1-Tastatur.

Berechne durch wiederholtes Subtrahieren, wie viele Kisten voll werden und wie viele Stücke übrig bleiben.

Verteile 83 Stück auf volle Kisten zu je neun Stück. `020 PC RUN` eingeben. Das Programm zieht neun Stück ab, solange der Vorrat für eine weitere volle Kiste reicht. Am Ende erscheint `P  035`, mit **ACC** dann `A00.002`. Zelle 039 enthält den Rest `00.002`, Zelle 040 den Quotienten `00.009`. Der Ablauf umfasst 90 Lehrbefehle ohne programmierte Wartezeit. Der Grundspeicher genügt. Belegt sind 020–034 und 039–042. Externe Anschlüsse sind nicht erforderlich.
