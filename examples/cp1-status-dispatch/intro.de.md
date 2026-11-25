---
level: advanced
age: 11+
prereqs: [cp1-first-display]
teaches: [indirect-jump, input-validation]
---
## Statusverteiler

Importiere ein kompatibles Monitor-ROM mit 2048 Bytes. Starte die CPU, bis der Monitor bereit ist. Halte die CPU an und lade die Zellen. Setze die CPU-Ausführung ohne Reset fort und wähle die Startadresse auf der CP1-Tastatur.

Stelle P1 über **Instrumente → Schalter** ein. Ein offener Schalter liest sich als High, ein geschlossener als Low. Schalter 1 ist das niederwertigste Bit.

Das vollständige P1-Byte wählt eine Statusroutine. Die Werte 0, 1 und 2 dienen als Index in einer Tabelle mit Sprungbefehlen. Höhere Werte führen zur Ersatzroutine. Alle acht Eingangsbits vor `082 PC RUN` einstellen und bis zum Anhalten halten. Das Ergebnis anhand der Tabelle prüfen und jeden Test wieder bei 082 beginnen. Die gültigen Routen führen neun Lehrbefehle aus, die Ersatzroutine fünf. Es gibt keine programmierte Wartezeit. Der Grundspeicher genügt. Belegt sind 082–095, 110–112 und 114–116.

| P1 | PC | ACC |
| --- | --- | --- |
| `0x00` | 090 | `A00.017` |
| `0x01` | 092 | `A00.071` |
| `0x02` | 094 | `A00.143` |
| `0x03` or / oder `0xFF` | 096 | `A00.239` |
