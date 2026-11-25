---
level: advanced
age: 11+
prereqs: [cp1-first-display]
teaches: [input-sampling, indirect-store]
---
## Messprotokoll

Importiere ein kompatibles Monitor-ROM mit 2048 Bytes. Starte die CPU, bis der Monitor bereit ist. Halte die CPU an und lade die Zellen. Setze die CPU-Ausführung ohne Reset fort und wähle die Startadresse auf der CP1-Tastatur.

Stelle P1 über **Instrumente → Schalter** ein. Ein offener Schalter liest sich als High, ein geschlossener als Low. Schalter 1 ist das niederwertigste Bit.

Erfasse drei P1-Messwerte mit demselben indirekten Speicherbefehl in aufeinanderfolgenden Zellen. Programm laden, `035 PC` eingeben und mit **STEP** bis zum Programmzählerstand 047 gehen. Vor dem ersten, zweiten und dritten Aufruf von Zelle 037 an P1 jeweils `0x35`, `0x8A` und `0xC7` anlegen. Den jeweiligen Pegel während des Schritts bei 037 halten. Die Tabelle zeigt das Ergebnis nach genau 25 Lehrbefehlen ohne programmierte Wartezeit. **ACC** zeigt den letzten Messwert `A00.199`. Mit **RUN** bei konstantem Eingang enthalten alle drei Zellen denselben Messwert. Der Grundspeicher genügt. Belegt sind 035–046, 062–064 und 076–078.

| Cell / Zelle | Word / Wort |
| --- | --- |
| 076 | `00.053` |
| 077 | `00.138` |
| 078 | `00.199` |
