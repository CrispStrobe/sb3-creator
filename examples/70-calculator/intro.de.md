# Taschenrechner

Ein benutzbarer Taschenrechner: ein **Raspberry Pi Pico**, ein
**GME12864-70**-OLED (SH1106-Klasse, 128×64, das 4-Pin-I²C-Modul) und
**siebzehn Tasten** auf Steckbrettern.

## Die Hardware

Hier gibt es keine Scan-Matrix — siebzehn Tasten, je eine pro GPIO,
**GP2–GP18**. Jede Taste hat ein Bein am Pin und das andere an
**+3V3 (nicht VBUS)**; den Rest erledigen die internen Pull-downs des Pico.
Eine gedrückte Taste liest deshalb **HIGH**, externe Widerstände sind nicht
nötig. Das kostet Pins und bringt Einfachheit: nichts zu scannen, kein
Entprellen über Zeilen hinweg.

Das OLED spricht I²C an **GP0 = SDA, GP1 = SCL** — vier Drähte zum
Display: VCC, GND, SCL, SDA.

```
9 0 1 2 3 4 5 6 7 8   Ziffern      GP2 .. GP11
+ - * /               Operatoren   GP12 .. GP15
EXE                   Gleich       GP16
DEL                   Rücktaste    GP17   (Pico-Pin 22)
AC                    alles weg    GP18   (Pico-Pin 24)
```

Gehäusenummerierung und GPIO-Nummerierung sind zwei verschiedene
Koordinatensysteme: **Gehäuse-Pin 22 ist GP17**. Vor dem Verdrahten
klären, welches gemeint ist.

## Wie das Bild gezeichnet wird

Früher übertrug jeder OLED-Befehl das ganze Bild. Ein 128×64-Bild sind
**1 KB über I²C**, und dieser Bildschirm besteht aus sechs Befehlen — ein
einziger Tastendruck schickte also sechs davon, und die Anzeige flimmerte
sichtbar. Dieses Programm beendet sein Bild mit `oled show`; damit schaltet
der Generator auf einen gepufferten Treiber: `oled clear` und jedes
`oled print` berühren nur das RAM, und am Ende geht genau eine Übertragung
hinaus.

```
Zeile 0   RECHNER
y 10      ----------------
Zeile 2   <acc> <op>          die wartende Rechnung, links
Zeile 5            <entry>    die Eingabe, rechtsbündig
y 55      ----------------
```

Die rechtsbündige Ausrichtung ist `oled set cursor 5 (16 - length of entry)`
— die 8×8-Schrift ergibt 128 px ÷ 8 = 16 Spalten. Diese Wendung ist
Pico-spezifisch: der C-OLED-Treiber nutzt eine 6-px-Zelle, dort stimmt
derselbe Ausdruck nicht.

## Ausprobieren

`5` `+` `3` `EXE` zeigt **8**. Kettenrechnung wie gewohnt: Zahl eintippen,
Operator drücken, nächste Zahl, `EXE`. `DEL` entfernt die zuletzt getippte
Ziffer, `AC` löscht alles. Ein angezeigtes Ergebnis ist nicht editierbar —
`DEL` setzt es auf 0, und die nächste Ziffer beginnt eine neue Zahl.

Die schlichtere Urfassung — `C` löscht die ganze Eingabe, kein gepufferter
Treiber — steht unter **Taschenrechner (einfach)**.
