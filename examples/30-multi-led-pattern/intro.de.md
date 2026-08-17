---
level: intermediate
age: 12+
prereqs: [12-dual-blink]
teaches: [led-patterns, bit-manipulation, animation]
---

## Was du siehst

Mehrere LEDs sind an aufeinanderfolgende MCU-Pins angeschlossen. Das Programm
durchlaeuft eine Reihe von Mustern -- alle an, alle aus, abwechselnd, Lauflicht
nach links, Lauflicht nach rechts, einzeln aufbauend -- und erzeugt eine
Lichtshow, die sich in einer Schleife wiederholt. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das aus

1. Klick auf **Sim** und schau dir den kompletten Musterzyklus an. Zaehle, wie
   viele verschiedene Muster es gibt, bevor er sich wiederholt.
2. Schau in den Code. Jedes Muster ist eine Liste von An/Aus-Zustaenden fuer
   jede LED, geschrieben als Binaerzahl oder als Liste aus Einsen und Nullen.
3. Aendere ein Muster in der Tabelle -- lass zum Beispiel beim „alle
   an"-Muster die mittlere LED aus. Starte erneut und sieh deine Aenderung
   in der Sequenz.

## Was passiert hier

Der MCU speichert jedes Muster als Bitfolge, ein Bit pro LED. Um ein Muster
anzuzeigen, schreibt er alle Bits auf einmal an den Port und schaltet die
richtigen LEDs ein und den Rest aus. Eine Verzoegerung zwischen den Mustern
bestimmt die Animationsgeschwindigkeit. Das Programm geht die Mustertabelle der
Reihe nach durch und springt dann zurueck zum Anfang. Das ist das gleiche
Prinzip wie Animationsbilder in einem Video: Jedes Bild ist ein Standbild, und
das Abspielen in Folge erzeugt die Illusion von Bewegung.

## Warum das wichtig ist

Mehrere Ausgaenge ueber eine Mustertabelle anzusteuern ist die Arbeitsweise von
LED-Matrizen, 7-Segment-Anzeigen und sogar Bildschirmpixeln. Der Sprung vom
Umschalten eines einzelnen Pins zum Orchestrieren von acht auf einmal ist der
Sprung von der Steuerung eines einzelnen Bauteils zur Steuerung eines Systems.

## Weiter geht's

- **Die Zwei-LED-Version:** [12-dual-blink](../12-dual-blink) -- unabhaengiges
  Timing an zwei LEDs, bevor Mustertabellen ins Spiel kommen.
- **Erweiterung mit Schieberegister:**
  [08-led-chaser-595](../08-led-chaser-595) -- mehr LEDs ansteuern als Pins
  vorhanden sind, ueber ein Schieberegister.
- **Zum Ausprobieren:** Fuege einen „Bounce"-Modus hinzu, bei dem das Lauflicht
  am Ende umkehrt und zuruecklaeuft, wie das Auge eines Cylons oder das
  Lichtband von Knight Rider.
