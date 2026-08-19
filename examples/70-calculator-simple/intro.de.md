# Taschenrechner (einfach)

Das Original der beiden. Dieselbe Hardware wie **Taschenrechner** — ein
**Raspberry Pi Pico**, ein **GME12864-70**-OLED (SH1106-Klasse, 128×64, I²C)
und **siebzehn Tasten** — aber die schlichteste Fassung des Programms,
aufgehoben als Referenz für zwei Dinge, die die andere Fassung geändert hat.

## Die Hardware

Siebzehn Tasten, je eine pro GPIO, **GP2–GP18**. Keine Scan-Matrix: jede Taste
hat ein Bein am Pin und das andere an **+3V3 (nicht VBUS)**, den Rest erledigen
die internen Pull-downs des Pico. Eine gedrückte Taste liest deshalb **HIGH**,
externe Widerstände sind nicht nötig. Das OLED braucht vier Leitungen — VCC,
GND und I²C an **GP0 = SDA, GP1 = SCL**.

```
9 0 1 2 3 4 5 6 7 8   Ziffern      GP2 .. GP11
+ - * /               Operatoren   GP12 .. GP15
EXE                   Gleich       GP16
C                     Eingabe weg  GP17   (Pico-Pin 22)
AC                    alles weg    GP18   (Pico-Pin 24)
```

Gehäusenummerierung und GPIO-Nummerierung sind zwei verschiedene
Koordinatensysteme: **Gehäuse-Pin 22 ist GP17**. Vor dem Verdrahten klären,
welches gemeint ist.

## Unterschiede zu `70-calculator`

- **`C` löscht die ganze Eingabe.** In der anderen Fassung ist diese Taste eine
  **Rücktaste**, die Ziffer für Ziffer entfernt.
- **Jeder OLED-Befehl überträgt sofort.** Dieses Programm sagt nie `oled show`,
  also erzeugt der Generator den Treiber, der direkt überträgt: jedes
  `oled clear` und jedes `oled print` schiebt ein volles 128×64-Bild — 1 KB über
  I²C — und ein Bildschirm aus sechs Befehlen sendet sechs davon pro Tastendruck.
  Genau dagegen wurde `oled show` eingeführt, weshalb dieses Programm die
  Referenz dafür ist, was der gepufferte Treiber ersetzt hat.

Keiner der beiden Unterschiede ist hier ein Fehler. Das ist das einfachere
Programm, und es ist das, das man zuerst liest.

## Ausprobieren

`5` `+` `3` `EXE` zeigt **8**. Der wartende Operand und der Operator stehen in
der oberen Zeile, solange eine Rechnung offen ist; `C` setzt die Eingabe
zurück, `AC` alles.
