---
level: intermediate
age: 12+
prereqs: [11-toggle-button]
teaches: [timing-measurement, random, human-interface]
---

## Was du siehst

Eine LED bleibt dunkel, waehrend der MCU eine zufaellige Anzahl Sekunden
wartet. Sobald die LED aufleuchtet, drueckst du so schnell wie moeglich den
Taster, und das Programm misst, wie viele Millisekunden zwischen Licht und
Tastendruck vergangen sind. Die 7-Segment-Anzeige (oder die serielle Ausgabe)
zeigt deine Reaktionszeit.

## Probier das aus

1. Klick auf **Sim** und warte. Die LED leuchtet nach einer zufaelligen
   Verzoegerung auf -- drueck den Taster nicht vorher.
2. In dem Moment, in dem die LED angeht, drueck den Taster. Deine
   Reaktionszeit erscheint auf der Anzeige.
3. Versuch, den Taster *vor* dem Aufleuchten zu druecken. Das Programm sollte
   das als Fehlstart erkennen.

## Was passiert hier

Der MCU waehlt eine zufaellige Verzoegerung (etwa 2--5 Sekunden), wartet so
lange, schaltet dann die LED ein und startet einen Millisekunden-Timer. Wenn
er den Tastendruck erkennt, stoppt er den Timer und gibt die verstrichene Zeit
aus. Die zufaellige Verzoegerung verhindert, dass man den Moment erraten kann,
sodass tatsaechlich die menschliche Reaktionszeit gemessen wird -- typischerweise
150--300 ms bei visuellen Reizen. Das fuehlt sich sofort an, ist aber fuer einen
Mikrocontroller, der mit Millionen Takten pro Sekunde laeuft, eine Ewigkeit.

## Warum das wichtig ist

Zeitmessung ist die Grundlage jedes Sensors, der ein physikalisches Ereignis in
eine Zahl verwandelt. Ultraschall-Entfernungsmesser, kapazitive Touchsensoren
und Frequenzzaehler funktionieren alle gleich: Uhr starten, auf ein Ereignis
warten, Uhr ablesen.

## Weiter geht's

- **Entprellen ist hier wichtig:** [26-debounce](../26-debounce) -- ein
  prellender Taster kann Millisekunden Rauschen zu deiner Messung beitragen.
- **Noch ein Zufallsprojekt:** [27-led-dice](../27-led-dice) -- Zufallszahlen
  steuern LED-Muster statt Zeitmessung.
- **Zum Ausprobieren:** Aendere den Bereich der zufaelligen Verzoegerung, sodass
  die LED schon nach 0,5 Sekunden oder erst nach 10 Sekunden aufleuchten kann.
  Wird deine Reaktionszeit schlechter, wenn du weisst, dass der Bereich groesser
  ist?
