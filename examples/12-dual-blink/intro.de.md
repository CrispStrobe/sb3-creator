---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [multi-output, timing, alternation]
---
## Was du siehst
Zwei LEDs an P1.0 und P1.1 blinken abwechselnd — wenn eine an ist, ist die andere aus. Beide sind active-low verdrahtet. Der Effekt ist ein gleichmäßiges Hin-und-Her-Blinken. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und beobachte die beiden LEDs im Wechsel.
2. Ändere das Timing, sodass eine LED länger an bleibt als die andere, und erzeuge ein asymmetrisches Muster.
3. Versuche, beide LEDs gleichzeitig blinken zu lassen (beide gleichzeitig an, beide gleichzeitig aus), indem du einen der Ein-/Aus-Befehle vertauschst.

## Was passiert hier
Das Programm führt eine Endlosschleife aus: LED1 ein und LED2 aus, warten, dann umgekehrt, und wieder warten. Da beide LEDs active-low sind, zieht „einschalten" den jeweiligen Pin auf LOW und „ausschalten" setzt ihn auf HIGH. Der MCU führt die Anweisungen sequenziell aus — es gibt keine echte Parallelität — aber das Umschalten ist so schnell, dass beide LEDs gleichzeitig zu wechseln scheinen. Die Wartezeit zwischen den Umschaltungen bestimmt die Blinkfrequenz.

## Warum das wichtig ist
Mehrere Ausgänge mit präzisem Timing zu steuern ist die Grundlage von Ampeln, Anzeigepanels und gemultiplexten Displays. Dieses Beispiel zeigt, dass selbst ein Single-Thread-MCU zwei Dinge gleichzeitig tun kann, solange er schnell genug umschaltet.

## Weiter geht's
- [01-blink](../01-blink) — die Einzel-LED-Version zum Vergleich.
- [08-led-chaser-595](../08-led-chaser-595) — auf acht LEDs hochskalieren mit einem Schieberegister.
- Experiment: Füge eine dritte LED hinzu und erstelle ein Rotationsmuster, bei dem immer nur eine der drei leuchtet.
