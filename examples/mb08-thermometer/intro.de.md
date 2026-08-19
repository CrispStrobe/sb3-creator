---
level: beginner
age: 8+
prereqs: []
teaches: [microbit, temperature, conditionals, display]
---

# Thermometer

Sieh die Temperatur auf einen Blick — der micro:bit zeigt je nach
Wärme ein anderes Symbol!

## Was du siehst

Das LED-Display zeigt eines von drei Mustern, das sich alle 2 Sekunden
aktualisiert:

- **Wellenlinien** — es ist warm (über 25 °C).
- **Kleine Raute** — angenehm (15–25 °C).
- **Große Schneeflocke** — es ist kalt (unter 15 °C).

## Probiere es aus

1. Übertrage das Programm auf deinen micro:bit.
2. Beobachte das Symbol — es sollte den Temperaturbereich des Raums zeigen.
3. Halte den micro:bit an eine warme Tasse oder eine kalte Oberfläche und
   beobachte, wie sich das Symbol ändert.
4. Hauche auf den Chip, um ihn leicht zu erwärmen.

## Was passiert hier

Der micro:bit hat einen Temperatursensor im Prozessorchip. Das Programm
liest ihn alle 2 Sekunden mit `read temperature` aus und nutzt zwei
`IF / ELSE`-Blöcke, um eines von drei Symbolen auszuwählen. Da es in
BrickWright kein `ELSE IF` gibt, ist die zweite Prüfung im ersten
`ELSE`-Block verschachtelt.

## Warum das wichtig ist

Einen kontinuierlichen Wert in Bereiche einzuteilen ist eine der
häufigsten Aufgaben in der eingebetteten Programmierung — Thermostate,
Batterieanzeigen und Ampelsteuerungen funktionieren alle so. Das
verschachtelte IF-Muster zeigt, wie man eine Mehrfachentscheidung ohne
eine `switch`-Anweisung umsetzt.

## Weiter gedacht

- Füge mehr Bereiche mit feineren Mustern hinzu (fünf statt drei).
- Passe die Schwellenwerte an dein lokales Klima an.
- Nutze den Lichtsensor (`read light`) für ein Helligkeitsmessgerät.
