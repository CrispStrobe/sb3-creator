---
level: advanced
age: 11+
prereqs: [cp1-first-display]
teaches: [single-step, cp3-memory, expansion-ports]
---
## Expansion step

Import a compatible 2,048-byte monitor ROM. Run the CPU until the monitor shows its ready display, pause it, and load the cells. Resume CPU execution without resetting, and use the CP1 keypad to select the start address.

Use **Instruments → Switches** to set P3. An open switch reads high and a closed switch reads low. Switch 1 is the least significant bit. The circuit includes CP3. Check P4 and P5 in the port view.

Install CP3 and drive P3 to `0xB6` (high on terminals 2, 3, 5, 6 and 8, low on the others). Load upper RAM and enter `196 PC`. Press **STEP** five times, checking the table after each press. The program occupies 196–200 and 212 in expansion RAM. Each step executes one instruction with no programmed delay.

| STEP | PC | Expected result / Erwartetes Ergebnis |
| --- | --- | --- |
| 1 | 197 | ACC `A00.182` |
| 2 | 198 | Cell / Zelle 212 `00.182` |
| 3 | 199 | P4 `0xB6` |
| 4 | 200 | P5 `0x36` across six outputs / an sechs Ausgängen |
| 5 | 201 | HLT, ACC `A00.182` |
