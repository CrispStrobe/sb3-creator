---
level: intermediate
age: 12+
prereqs: [11-toggle-button]
teaches: [timing-measurement, random, human-interface]
---

## Was du siehst

Eine LED bleibt drei Sekunden lang dunkel. Sobald sie aufleuchtet, drueckst du
so schnell wie moeglich den Taster, und das Programm zaehlt, wie lange das
gedauert hat. Auf diesem Steckbrett gibt es keine Anzeige: die LED selbst
meldet das Ergebnis und blinkt einmal pro 10 ms deiner Reaktionszeit -- eine
typische Reaktion von 250 ms sind also etwa 25 Blinker. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das aus

1. Klick auf **Sim** und warte drei Sekunden -- drueck den Taster nicht, bevor
   die LED angeht.
2. In dem Moment, in dem die LED angeht, drueck den Taster. Die LED blinkt dir
   deine Reaktionszeit zurueck, ein Blinker pro 10 ms.
3. Zaehl die Blinker. Etwa 15 ist sehr schnell, 25 ist typisch, 40 heisst, du
   warst abgelenkt.

## Was passiert hier

Der MCU wartet feste drei Sekunden, schaltet die LED ein und zaehlt in
10-ms-Schritten, bis der Taster auf LOW geht. Danach blinkt er diesen Zaehler
zurueck. Die menschliche Reaktion auf einen visuellen Reiz liegt typischerweise
bei 150--300 ms. Das fuehlt sich sofort an, ist aber fuer einen Mikrocontroller,
der mit Millionen Takten pro Sekunde laeuft, eine Ewigkeit: in 250 ms fuehrt
dieser Chip weit ueber eine Million Befehle aus.

Dass die Verzoegerung *fest* ist, ist die eigentliche Schwaeche dieser Version
und lohnt sich zu bemerken: nach ein paar Durchgaengen ahnst du den Moment
voraus und misst gar keine Reaktion mehr. Ein echter Reaktionstester wuerde
wuerfeln -- das ist die erste Uebung unten.

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
- **Zum Ausprobieren:** Mach die Verzoegerung unvorhersehbar. Das Wuerfel-
  Beispiel zeigt den Trick ganz ohne Zufallsbefehl: lass einen Zaehler schnell
  laufen und lass den Moment, in dem *du* startest, entscheiden, wo er stehen
  bleibt.
- **Zum Ausprobieren:** Erkenne einen Fehlstart. Beobachte den Taster waehrend
  der drei Sekunden, und wenn er vor der LED auf LOW geht, brich die Runde ab
  und melde es -- etwa mit drei kurzen Blinkern.
