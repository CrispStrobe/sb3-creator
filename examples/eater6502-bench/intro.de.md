---
level: advanced
age: 14+
prereqs: [01-blink]
teaches: [address-decode, bus-contention, open-vectors, memory-map, glue-logic]
---
## Was du siehst
Ein vollständiger 6502-Computer im Ben-Eater-Stil auf einem Breadboard: W65C02-CPU, 32 KB RAM (62256), 32 KB ROM (28C256), ein W65C22 VIA (parallele Ein-/Ausgabe), ein W65C51 ACIA (seriell) und zwei 74HC00-NAND-Gatter, die den Adressbus dekodieren.

## Probier das
1. Einschalten und starten — im Warnungen-Panel sollten keine Bus-Contention-Fehler erscheinen.
2. Lies die Speicherkarten-Notizen im Warnungen-Panel: RAM bei $0000–$3FFF, ROM bei $8000–$FFFF, VIA bei $6000, ACIA bei $5000.
3. Trenne die Leitung von glue1.1y zu rom.ceb und beobachte, wie der Extraktor einen Open-Vectors-Fehler meldet: nichts antwortet bei $FFFA–$FFFF.

## Was passiert hier
Der 6502 sieht einen flachen 64-KB-Adressraum. Jeder Chip am Bus darf NUR auf seinen zugewiesenen Adressen antworten — antworten zwei Chips auf dieselbe Adresse, kämpfen sie um den Datenbus (**Bus-Contention**), was bestenfalls Datenmüll liefert und schlimmstenfalls Chips beschädigt.

Die **Adressdekodierung** verwendet zwei 74HC00-Vierfach-NAND-Bausteine, um Chip-Select-Signale aus den oberen Adressleitungen zu erzeugen:
- **RAM** ($0000–$3FFF): ausgewählt wenn A15=0 UND A14=0.
- **ROM** ($8000–$FFFF): ausgewählt wenn A15=1.
- **VIA** ($6000–$7FFF): ausgewählt wenn A15=0 UND A14=1 UND A13=1.
- **ACIA** ($5000–$5FFF): ausgewählt wenn der VIA NICHT ausgewählt ist UND A13=0 UND A12=1.

Die **Vektoren** ($FFFA–$FFFF: NMI, RESET, IRQ) müssen im ROM liegen. Ist der Chip-Enable des ROMs falsch verdrahtet, liest die CPU beim Einschalten Datenmüll und startet nie.

## Warum das wichtig ist
Adressdekodierung ist die erste echte Hardware-Design-Kompetenz. Eine funktionierende Speicherkarte bedeutet, dass du Binärlogik, Chip-Selects und den Bus verstehst — und das macht aus einem Haufen Chips einen Computer. Jeder Retro-Computer (Apple II, BBC Micro, Commodore 64) hat genau diese Struktur.

## Weiter geht's
- [eater6502-contention-bug](../eater6502-contention-bug) — dieselbe Schaltung mit einem absichtlichen Verdrahtungsfehler. Kannst du finden, wo zwei Chips kollidieren?
- [eater6502-vdp-hello](../eater6502-vdp-hello) — einen TMS9918A-Videochip an den Bus anschließen.
- [z80-bench](../z80-bench) — eine andere klassische CPU auf dem Breadboard.
