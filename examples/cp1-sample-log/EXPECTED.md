# Sample log / Messprotokoll

**EN.** Record three P1 samples in consecutive cells with one indirect store instruction. Load the listing, enter `035 PC`, and use **STEP** until the program counter reaches 047. Before the first, second, and third execution of cell 037, set the whole P1 group to `0x35`, `0x8A`, and `0xC7` respectively. Hold each level through the step at 037. Expect the results below after exactly 25 teaching steps with no programmed delay. **ACC** shows the last sample, `A00.199`. With **RUN** and a constant input the three records contain the same sample. Base memory suffices. The program occupies 035–046, 062–064, and 076–078.

**DE.** Erfasse drei P1-Messwerte mit demselben indirekten Speicherbefehl in aufeinanderfolgenden Zellen. Programm laden, `035 PC` eingeben und mit **STEP** bis zum Programmzählerstand 047 gehen. Vor dem ersten, zweiten und dritten Aufruf von Zelle 037 an P1 jeweils `0x35`, `0x8A` und `0xC7` anlegen. Den jeweiligen Pegel während des Schritts bei 037 halten. Die Tabelle zeigt das Ergebnis nach genau 25 Lehrbefehlen ohne programmierte Wartezeit. **ACC** zeigt den letzten Messwert `A00.199`. Mit **RUN** bei konstantem Eingang enthalten alle drei Zellen denselben Messwert. Der Grundspeicher genügt. Belegt sind 035–046, 062–064 und 076–078.

| Cell / Zelle | Word / Wort |
| --- | --- |
| 076 | `00.053` |
| 077 | `00.138` |
| 078 | `00.199` |

### 1. Verification

Start at `35` and run to HLT.
- Set P1 to 0x35 at `Sample`.
- Set P1 to 0x8a at `Sample`.
- Set P1 to 0xc7 at `Sample`.
- Expected PC `47`.
- Expected accumulator `00.199`.
- Expected `076` = 00.053.
- Expected `077` = 00.138.
- Expected `078` = 00.199.
