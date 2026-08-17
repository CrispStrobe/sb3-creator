# Taschenrechner

Ein benutzbarer Taschenrechner: ein Arduino Nano, ein **GME12864-70
OLED** (SSD1306, 128×64, das 4-Pin-I²C-Modul in Weiß/Blau) und
**fünfzehn Tasten** auf Steckbrettern.

## So funktioniert es

Die fünfzehn Tasten liegen auf einer **4×4-Scan-Matrix** — vier
Zeilenleitungen werden nacheinander getrieben (D2–D5), vier Spalten
über 10-kΩ-Pull-downs zurückgelesen (D6, D7, D8, D12). So kommt jede
echte Tastatur ohne einen Pin pro Taste aus: 8 Pins tragen 15 Tasten.

Das OLED spricht I²C auf den echten Bus-Pins des Nano (**A4 = SDA,
A5 = SCL**) — vier Drähte zum Display: VCC, GND, SCL, SDA.

Die Rechenlogik ist klassische Kettenrechnung: Zahl eintippen,
Operator drücken, nächste Zahl, `=`. `C` löscht die Eingabe, `AC`
alles.

## Ausprobieren

Programm starten, dann im SIM-Modus die Tasten klicken:
`5` `+` `3` `=` zeigt **8**. Der `+`/`−`-Indikator erscheint oben
rechts, solange eine Operation aussteht.

Tastenbelegung:

```
7 8 9 +
4 5 6 −
1 2 3 =
0 C AC
```
