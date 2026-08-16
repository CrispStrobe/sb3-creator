# Blink — das erste Licht des 6502-Steckbrett-Computers

Das ist der Moment, auf den jeder Ben-Eater-Aufbau hinarbeitet: acht
LEDs an Port B des VIA, als Lauflicht. Die Maschine ist echt — W65C02,
32K RAM, 32K ROM, der 6522 VIA, NAND-Adressdekodierung — aufgesteckt
auf vier Breadboards wie beim physischen Aufbau.

**Beobachte:** Drücke die grüne Flagge. Das Programm wird für den 6502
kompiliert, der Bus-Extraktor liest die sichtbare Verdrahtung, und die
LEDs leuchten nacheinander — jede eine echt simulierte LED mit echtem
Vorwiderstand, kein Bild einer LED.

**Probiere:** Ändere die Wartezeiten, oder schalte zwei LEDs
gleichzeitig ein. Öffne dann das Circuit-Check-Panel und finde die
Adresskarte, die der Extraktor aus der NAND-Verdrahtung ableitet.
