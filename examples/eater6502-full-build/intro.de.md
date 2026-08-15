---
level: advanced
age: 14+
prereqs: [eater6502-bench]
teaches: [full-build, binary-counting, bar-graph, lcd, 555-clock, address-decode]
---
## Was du siehst
Der vollständige Ben-Eater-6502-Breadboard-Computer: W65C02-CPU, RAM, ROM, VIA, ACIA, zwei NAND-Dekodier-Gatter — plus die Vollausbau-Extras: ein 10-LED-Balkendiagramm an VIA-Port A zeigt einen Binärzähler, ein HD44780-LCD an Port B und ein 555-Timer als Taktquelle.

## Probier das
1. Starte das Programm — das Balkendiagramm zählt binär (0–255) und springt zurück.
2. Beobachte den Zähler in der seriellen Ausgabe neben dem LED-Muster.
3. Ändere die Wartezeit von 0,25 auf 0,05 Sekunden — der Zähler rast.
4. Zähle nur die unteren 4 Bits (mod 16 statt mod 256) — nur die ersten 4 LEDs leuchten.

## Was passiert hier
Port A des VIA treibt 8 LEDs über das Balkendiagramm. Das Programm inkrementiert einen Zähler und extrahiert mit Bitmaskierung (Division durch Zweierpotenzen, dann mod 2) jedes Bit für die entsprechende LED.

## Warum das wichtig ist
Das ist der Vollausbau — alles, was ein Retro-Computer braucht: CPU, Speicher, Ein/Ausgabe, Anzeige und Takt.

## Weiter geht's
- [eater6502-bench](../eater6502-bench) — die Minimalversion ohne Extras.
- [eater6502-contention-bug](../eater6502-contention-bug) — ein absichtlicher Verdrahtungsfehler zum Debuggen.
- Versuche ein Knight-Rider-Muster (LEDs scannen links-rechts) statt Binärzählung.
