# A2-LCD1602 mit Laufschrift

Die vermessene direkte 4-Bit-Verbindung: D4–D7 an P0.4–P0.7 und
RS/RW/EN an P2.6/P2.5/P2.7. Der Titel wandert über die obere Zeile.

J24 muss auf OE–VCC stehen, damit die 8×8-Matrix P0 freigibt. Das LCD
wird gegenüber der naheliegenden Orientierung um 180° gedreht eingesetzt
und überlappt den MCU leicht. Andersherum bleiben eine Zeile leer und
eine vollständig weiß.

