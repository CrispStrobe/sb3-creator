---
level: intermediate
age: 12+
prereqs: [arduino-03-calibration]
teaches: [theremin, ldr, tone, auto-calibration]
---
## Was du siehst
Licht-Theremin: kalibriert einen LDR-Sensor automatisch und bildet Licht auf die Tonhöhe eines Buzzers ab.

## Probier das
1. Starte das Programm und interagiere mit dem Eingang.
2. Ändere die Schwellwerte oder Zuordnung und beobachte die Wirkung.

## Was passiert hier
Dieses Arduino-Starter-Kit-Projekt lehrt ein grundlegendes Interaktionsmuster.

## Dreh am Potentiometer — es vertritt den Lichtsensor

Das Programm liest seinen Eingang als `ldr` an A0, aber die simulierte Schaltung
hat an A0 ein **Potentiometer** statt eines lichtabhängigen Widerstands: In eine
Simulation kann man nicht hineinleuchten, also liefert das Poti dieselbe
veränderliche Spannung von Hand. Dreh daran, und die Tonhöhe folgt. Auf echter
Hardware ersetzt du das Poti durch einen LDR mit Festwiderstand als Teiler — die
Skizze bleibt gleich.

## Weiter geht's
- Kombiniere dies mit anderen Projekten für komplexere Interaktionen.
