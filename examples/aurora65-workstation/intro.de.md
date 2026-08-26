---
level: advanced
age: 14+
prereqs: [01-blink]
teaches: [address-decode, via, ps2, oled, i2c, vga, memory-map, glue-logic]
---
## Was du siehst
Die vollständige **Aurora-65 Display-Workstation**: W65C02, RAM, ROM,
W65C22 VIA, W65C51 ACIA, SSD1306-OLED, eine anklickbare PS/2-Tastatur mit
74 Tasten und eine SimpleVGA6502-Karte. OLED und VGA im Controller spiegeln
die echten Bauteil-Puffer und keine Scratch-Textvariablen.

## Probier das
1. Starte die Workstation. Das ROM erzeugt zuerst VGA-Sync und initialisiert dann das OLED über VIA PB1/PB2.
2. Tippe im Controller oder klicke eine Taste direkt auf der Tastatur in der Schaltung.
3. Derselbe PS/2-Scancode erscheint als Farbspur auf VGA und als Balken-/Bitmuster auf dem OLED.
4. Trenne `kbd.da → via.ca1`: Die Tastatur sendet weiter, aber der 6502 sieht kein DATA READY mehr.

## Was passiert hier
Der 6502 sieht einen flachen 64-KB-Adressraum. Jeder Chip am Bus darf NUR auf seinen zugewiesenen Adressen antworten — antworten zwei Chips auf dieselbe Adresse, kämpfen sie um den Datenbus (**Bus-Contention**), was bestenfalls Datenmüll liefert und schlimmstenfalls Chips beschädigt.

Die **Adressdekodierung** verwendet zwei 74HC00-Vierfach-NAND-Bausteine, um Chip-Select-Signale aus den oberen Adressleitungen zu erzeugen:
- **RAM** ($0000–$3FFF): ausgewählt wenn A15=0 UND A14=0.
- **ROM** ($8000–$FFFF): ausgewählt wenn A15=1.
- **VIA** ($6000–$7FFF): ausgewählt wenn A15=0 UND A14=1 UND A13=1.
- **ACIA** ($5000–$5FFF): ausgewählt wenn der VIA NICHT ausgewählt ist UND A13=0 UND A12=1.

Die **Vektoren** ($FFFA–$FFFF: NMI, RESET, IRQ) müssen im ROM liegen. Ist der Chip-Enable des ROMs falsch verdrahtet, liest die CPU beim Einschalten Datenmüll und startet nie.

Ein VIA erledigt drei Aufgaben ohne Pin-Konflikt: PA0–PA7 empfängt das
Tastaturbyte, CA1 meldet DATA READY, PB0 wählt die VGA-VRAM-Bank und PB1/PB2
bilden den I²C-Bus zum OLED. `program.c`, `startup.s` und `program.cfg`
erzeugen mit `./build-rom.sh` reproduzierbar das 32-KB-ROM.

Die VGA-Logik folgt gfoots unter der Unlicense veröffentlichtem
**simplevga6502**. PS/2 und SSD1306 sind eigene Implementierungen aus
veröffentlichten Protokoll- und Datenblatt-Fakten. Aus dem rehsd-Artikel
wurden wegen der fehlenden formalen Lizenz keine EasyEDA-, Gerber-,
Artwork- oder Quelldateien übernommen.

## Warum das wichtig ist
Adressdekodierung ist die erste echte Hardware-Design-Kompetenz. Eine funktionierende Speicherkarte bedeutet, dass du Binärlogik, Chip-Selects und den Bus verstehst — und das macht aus einem Haufen Chips einen Computer. Jeder Retro-Computer (Apple II, BBC Micro, Commodore 64) hat genau diese Struktur.

## Weiter geht's
- [eater6502-contention-bug](../eater6502-contention-bug) — dieselbe Schaltung mit einem absichtlichen Verdrahtungsfehler. Kannst du finden, wo zwei Chips kollidieren?
- [eater6502-vdp-hello](../eater6502-vdp-hello) — einen TMS9918A-Videochip an den Bus anschließen.
- [z80-bench](../z80-bench) — eine andere klassische CPU auf dem Breadboard.
