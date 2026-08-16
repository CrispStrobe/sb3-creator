## Was du siehst
Ein 16×2-Zeichen-LCD mit I2C-Backpack: Zwei Leitungen (SDA an P2.1, SCL an P2.2) übertragen alles, was das Display zeigt. Die erste Zeile grüßt, die zweite zählt jede Sekunde hoch.

## Probiere das
1. Starte das Programm — erst erscheint "HELLO BRICKWRIGHT", dann tickt der Zähler.
2. Ändere im Code-Tab den Begrüßungstext.
3. Echtes Werkbank-Wissen: I2C braucht die beiden Pull-up-Widerstände — die Busleitungen ziehen nur nach LOW; das HIGH machen die Widerstände.
