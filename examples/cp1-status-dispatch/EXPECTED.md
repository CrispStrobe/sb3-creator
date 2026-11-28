# Status dispatch / Statusverteiler

**EN.** The whole P1 byte selects a status handler. Values 0, 1 and 2 index a table of jump instructions. Higher bytes enter a fallback handler. Drive all eight input bits before entering `082 PC RUN` and hold them through halt. Check the table, then repeat from 082 for each input. The valid routes execute nine teaching instructions and the fallback executes five, with no programmed delay. Base memory suffices. The program occupies 082–095, 110–112, and 114–116.

**DE.** Das vollständige P1-Byte wählt eine Statusroutine. Die Werte 0, 1 und 2 dienen als Index in einer Tabelle mit Sprungbefehlen. Höhere Werte führen zur Ersatzroutine. Alle acht Eingangsbits vor `082 PC RUN` einstellen und bis zum Anhalten halten. Das Ergebnis anhand der Tabelle prüfen und jeden Test wieder bei 082 beginnen. Die gültigen Routen führen neun Lehrbefehle aus, die Ersatzroutine fünf. Es gibt keine programmierte Wartezeit. Der Grundspeicher genügt. Belegt sind 082–095, 110–112 und 114–116.

| P1 | PC | ACC |
| --- | --- | --- |
| `0x00` | 090 | `A00.017` |
| `0x01` | 092 | `A00.071` |
| `0x02` | 094 | `A00.143` |
| `0x03` or / oder `0xFF` | 096 | `A00.239` |

### 1. Verification

Start at `82` and run to HLT.
- Set P1 to 0x00 at `82`.
- Expected PC `90`.
- Expected accumulator `00.017`.

### 2. Verification

Start at `82` and run to HLT.
- Set P1 to 0x01 at `82`.
- Expected PC `92`.
- Expected accumulator `00.071`.

### 3. Verification

Start at `82` and run to HLT.
- Set P1 to 0x02 at `82`.
- Expected PC `94`.
- Expected accumulator `00.143`.

### 4. Verification

Start at `82` and run to HLT.
- Set P1 to 0x03 at `82`.
- Expected PC `96`.
- Expected accumulator `00.239`.

### 5. Verification

Start at `82` and run to HLT.
- Set P1 to 0xff at `82`.
- Expected PC `96`.
- Expected accumulator `00.239`.
