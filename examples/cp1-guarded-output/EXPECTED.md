# Guarded output / Bedingter Ausgang

**EN.** P2 terminal 5 goes high only when P1 terminal 2 is high and P1 terminal 7 is low. Set those two input levels before entering `030 PC RUN` and hold them until halt. Start each test at 030. Expect `P  037` after seven teaching instructions with no programmed delay. **ACC** shows the output bit as `A00.000` or `A00.001`. The program preserves the other P2 output bits. Base memory suffices. It occupies 030–036 and 046.

**DE.** P2-Anschluss 5 wird nur dann High, wenn P1-Anschluss 2 High und P1-Anschluss 7 Low ist. Die beiden Eingangspegel vor `030 PC RUN` einstellen und bis zum Anhalten halten. Jeden Test bei 030 beginnen. Nach sieben Lehrbefehlen ohne programmierte Wartezeit erscheint `P  037`. **ACC** zeigt das Ausgangsbit als `A00.000` oder `A00.001`. Die übrigen P2-Ausgangsbits bleiben erhalten. Der Grundspeicher genügt. Belegt sind 030–036 und 046.

| P1 terminal 2 | P1 terminal 7 | P2 terminal 5 | P2 with other bits high / P2 mit übrigen Bits High |
| --- | --- | --- | --- |
| Low | Low | Low | `0xEF` |
| Low | High | Low | `0xEF` |
| High | Low | High | `0xFF` |
| High | High | Low | `0xEF` |

### 1. Verification

Start at `30` and run to HLT.
- Set P1 to 0x00 at `30`.
- Expected PC `37`.
- Expected accumulator `00.000`.
- P2 latch = 0xef.

### 2. Verification

Start at `30` and run to HLT.
- Set P1 to 0x40 at `30`.
- Expected PC `37`.
- Expected accumulator `00.000`.
- P2 latch = 0xef.

### 3. Verification

Start at `30` and run to HLT.
- Set P1 to 0x02 at `30`.
- Expected PC `37`.
- Expected accumulator `00.001`.
- P2 latch = 0xff.

### 4. Verification

Start at `30` and run to HLT.
- Set P1 to 0x42 at `30`.
- Expected PC `37`.
- Expected accumulator `00.000`.
- P2 latch = 0xef.
